import * as dagPb from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import parallel from 'it-parallel'
import toBuffer from 'it-to-buffer'
import * as raw from 'multiformats/codecs/raw'
import { CustomProgressEvent } from 'progress-events'
import { DEFAULT_BLOCK_READ_CONCURRENCY } from '../../../constants.ts'
import { NotUnixFSError, OverReadError, UnderReadError } from '../../../errors.ts'
import { extractDataFromBlock } from '../../utils/extract-data-from-block.ts'
import { validateOffsetAndLength } from '../../utils/validate-offset-and-length.ts'
import type { ReadableStorage, ExportProgress, ExportWalk, ExportContentOptions } from '../../../index.ts'
import type { CID } from 'multiformats/cid'

interface Child {
  cid: CID
  node: dagPb.PBNode | Uint8Array
  blockStart: bigint
}

/**
 * Yields the file data in `[start, end)` in DAG order. Blocks are fetched as
 * the consumer pulls, with up to `blockReadConcurrency` siblings read ahead
 * per level. Uses an explicit stack instead of recursion so deep DAGs cannot
 * overflow the call stack.
 */
async function * walkDAG (blockstore: ReadableStorage, root: dagPb.PBNode, start: bigint, end: bigint, options: ExportContentOptions): AsyncGenerator<Uint8Array> {
  const stack: Array<AsyncGenerator<Child>> = []
  let next: { node: dagPb.PBNode | Uint8Array, blockStart: bigint } | undefined = { node: root, blockStart: 0n }

  try {
    while (next != null) {
      const { data, children } = visitNode(blockstore, next.node, next.blockStart, start, end, options)

      if (data != null) {
        yield data
      }

      if (children != null) {
        stack.push(children)
      }

      next = undefined

      while (stack.length > 0) {
        const result = await stack[stack.length - 1].next()

        if (result.done === true) {
          stack.pop()
          continue
        }

        options.onProgress?.(new CustomProgressEvent<ExportWalk>('unixfs:exporter:walk:file', {
          cid: result.value.cid
        }))

        next = result.value
        break
      }
    }
  } finally {
    // stop each level from starting new reads. In-flight reads are not
    // aborted because a blockstore may share them with other callers
    while (stack.length > 0) {
      await stack.pop()?.return(undefined)
    }
  }
}

/**
 * Returns the node's data trimmed to `[start, end)` and a lazy, ordered
 * iterator that fetches the children overlapping that range
 */
function visitNode (blockstore: ReadableStorage, node: dagPb.PBNode | Uint8Array, streamPosition: bigint, start: bigint, end: bigint, options: ExportContentOptions): { data?: Uint8Array, children?: AsyncGenerator<Child> } {
  // a `raw` node
  if (node instanceof Uint8Array) {
    return { data: extractDataFromBlock(node, streamPosition, start, end) }
  }

  if (node.Data == null) {
    throw new NotUnixFSError('no data in PBNode')
  }

  let file: UnixFS

  try {
    file = UnixFS.unmarshal(node.Data)
  } catch (err: any) {
    throw new NotUnixFSError(err.message)
  }

  let data: Uint8Array | undefined

  // might be a unixfs `raw` node or have data on intermediate nodes
  if (file.data != null) {
    data = extractDataFromBlock(file.data, streamPosition, start, end)
    streamPosition += BigInt(data.byteLength)
  }

  const childOps: Array<{ link: dagPb.PBLink, blockStart: bigint }> = []

  if (node.Links.length !== file.blockSizes.length) {
    throw new NotUnixFSError('Inconsistent block sizes and dag links')
  }

  for (let i = 0; i < node.Links.length; i++) {
    const childLink = node.Links[i]
    const childStart = streamPosition // inclusive
    const childEnd = childStart + file.blockSizes[i] // exclusive

    if ((start >= childStart && start < childEnd) || // child has offset byte
        (end >= childStart && end <= childEnd) || // child has end byte
        (start < childStart && end > childEnd)) { // child is between offset and end bytes
      childOps.push({
        link: childLink,
        blockStart: streamPosition
      })
    }

    streamPosition = childEnd

    if (streamPosition > end) {
      break
    }
  }

  if (childOps.length === 0) {
    return { data }
  }

  const children = parallel(childOps.map(({ link, blockStart }) => async (): Promise<Child> => {
    const block = await toBuffer(blockstore.get(link.Hash, options))

    switch (link.Hash.code) {
      case dagPb.code:
        return { cid: link.Hash, node: dagPb.decode(block), blockStart }
      case raw.code:
        return { cid: link.Hash, node: block, blockStart }
      default:
        throw new NotUnixFSError(`Unsupported codec: ${link.Hash.code}`)
    }
  }), {
    ordered: true,
    concurrency: options.blockReadConcurrency ?? DEFAULT_BLOCK_READ_CONCURRENCY
  })

  return { data, children }
}

export function fileContent (cid: CID, node: dagPb.PBNode, unixfs: UnixFS, path: string, blockstore: ReadableStorage): (options: ExportContentOptions) => AsyncGenerator<Uint8Array> {
  async function * yieldFileContent (options: ExportContentOptions = {}): AsyncGenerator<Uint8Array> {
    const fileSize = unixfs.fileSize()

    if (fileSize === undefined) {
      throw new Error('File was a directory')
    }

    const {
      start,
      end
    } = validateOffsetAndLength(fileSize, options.offset, options.length)

    if (end === 0n) {
      return
    }

    let read = 0n
    const wanted = end - start

    options.onProgress?.(new CustomProgressEvent<ExportWalk>('unixfs:exporter:walk:file', {
      cid
    }))

    for await (const buf of walkDAG(blockstore, node, start, end, options)) {
      read += BigInt(buf.byteLength)

      if (read > wanted) {
        throw new OverReadError('Read too many bytes - the file size reported by the UnixFS data in the root node may be incorrect')
      }

      options.onProgress?.(new CustomProgressEvent<ExportProgress>('unixfs:exporter:progress:unixfs:file', {
        bytesRead: read,
        totalBytes: wanted,
        fileSize
      }))

      yield buf

      if (read === wanted) {
        break
      }
    }

    if (read < wanted) {
      throw new UnderReadError('Traversed entire DAG but did not read enough bytes')
    }
  }

  return yieldFileContent
}
