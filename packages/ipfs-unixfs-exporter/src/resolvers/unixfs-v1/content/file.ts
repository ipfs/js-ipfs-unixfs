import * as dagPb from '@ipld/dag-pb'
import errCode from 'err-code'
import { UnixFS } from 'ipfs-unixfs'
import map from 'it-map'
import parallel from 'it-parallel'
import { pipe } from 'it-pipe'
import { type Pushable, pushable } from 'it-pushable'
import * as raw from 'multiformats/codecs/raw'
import PQueue from 'p-queue'
import { CustomProgressEvent } from 'progress-events'
import extractDataFromBlock from '../../../utils/extract-data-from-block.js'
import validateOffsetAndLength from '../../../utils/validate-offset-and-length.js'
import type { ExporterOptions, UnixfsV1FileContent, UnixfsV1Resolver, ReadableStorage, ExportProgress, ExportWalk } from '../../../index.js'

async function walkDAG (blockstore: ReadableStorage, node: dagPb.PBNode | Uint8Array, queue: Pushable<Uint8Array>, streamPosition: bigint, start: bigint, end: bigint, options: ExporterOptions): Promise<void> {
  // a `raw` node
  if (node instanceof Uint8Array) {
    const buf = extractDataFromBlock(node, streamPosition, start, end)

    queue.push(buf)

    return
  }

  if (node.Data == null) {
    throw errCode(new Error('no data in PBNode'), 'ERR_NOT_UNIXFS')
  }

  let file: UnixFS

  try {
    file = UnixFS.unmarshal(node.Data)
  } catch (err: any) {
    throw errCode(err, 'ERR_NOT_UNIXFS')
  }

  // might be a unixfs `raw` node or have data on intermediate nodes
  if (file.data != null) {
    const data = file.data
    const buf = extractDataFromBlock(data, streamPosition, start, end)

    queue.push(buf)

    streamPosition += BigInt(buf.byteLength)
  }

  const childOps: Array<{ link: dagPb.PBLink, blockStart: bigint }> = []

  if (node.Links.length !== file.blockSizes.length) {
    throw errCode(new Error('Inconsistent block sizes and dag links'), 'ERR_NOT_UNIXFS')
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

  await pipe(
    childOps,
    (source) => map(source, (op) => {
      return async () => {
        const block = await blockstore.get(op.link.Hash, options)

        return {
          ...op,
          block
        }
      }
    }),
    (source) => parallel(source, {
      ordered: true
    }),
    async (source) => {
      for await (const { link, block, blockStart } of source) {
        let child: dagPb.PBNode | Uint8Array
        switch (link.Hash.code) {
          case dagPb.code:
            child = dagPb.decode(block)
            break
          case raw.code:
            child = block
            break
          default:
            queue.end(errCode(new Error(`Unsupported codec: ${link.Hash.code}`), 'ERR_NOT_UNIXFS'))
            return
        }

        // create a queue for this child - we use a queue instead of recursion
        // to avoid overflowing the stack
        const childQueue = new PQueue({
          concurrency: 1
        })
        // if any of the child jobs error, end the read queue with the error
        childQueue.on('error', error => {
          queue.end(error)
        })

        // if the job rejects the 'error' event will be emitted on the child queue
        void childQueue.add(async () => {
          options.onProgress?.(new CustomProgressEvent<ExportWalk>('unixfs:exporter:walk:file', {
            cid: link.Hash
          }))

          await walkDAG(blockstore, child, queue, blockStart, start, end, options)
        })

        // wait for this child to complete before moving on to the next
        await childQueue.onIdle()
      }
    }
  )

  if (streamPosition >= end) {
    queue.end()
  }
}

const fileContent: UnixfsV1Resolver = (cid, node, unixfs, path, resolve, depth, blockstore) => {
  async function * yieldFileContent (options: ExporterOptions = {}): UnixfsV1FileContent {
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
    const queue = pushable()

    options.onProgress?.(new CustomProgressEvent<ExportWalk>('unixfs:exporter:walk:file', {
      cid
    }))

    void walkDAG(blockstore, node, queue, 0n, start, end, options)
      .catch(err => {
        queue.end(err)
      })

    for await (const buf of queue) {
      if (buf == null) {
        continue
      }

      read += BigInt(buf.byteLength)

      if (read > wanted) {
        queue.end()
        throw errCode(new Error('Read too many bytes - the file size reported by the UnixFS data in the root node may be incorrect'), 'ERR_OVER_READ')
      }

      if (read === wanted) {
        queue.end()
      }

      options.onProgress?.(new CustomProgressEvent<ExportProgress>('unixfs:exporter:progress:unixfs:file', {
        bytesRead: read,
        totalBytes: wanted,
        fileSize
      }))

      yield buf
    }

    if (read < wanted) {
      throw errCode(new Error('Traversed entire DAG but did not read enough bytes'), 'ERR_UNDER_READ')
    }
  }

  return yieldFileContent
}

export default fileContent
