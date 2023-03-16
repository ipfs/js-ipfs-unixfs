import extractDataFromBlock from '../../../utils/extract-data-from-block.js'
import validateOffsetAndLength from '../../../utils/validate-offset-and-length.js'
import { UnixFS } from 'ipfs-unixfs'
import errCode from 'err-code'
import * as dagPb from '@ipld/dag-pb'
import * as raw from 'multiformats/codecs/raw'
import { Pushable, pushable } from 'it-pushable'
import parallel from 'it-parallel'
import { pipe } from 'it-pipe'
import map from 'it-map'
import PQueue from 'p-queue'
import type { ExporterOptions, UnixfsV1FileContent, UnixfsV1Resolver, Blockstore } from '../../../index.js'

async function walkDAG (blockstore: Blockstore, node: dagPb.PBNode | Uint8Array, queue: Pushable<Uint8Array>, streamPosition: bigint, start: bigint, end: bigint, walkQueue: PQueue, options: ExporterOptions): Promise<void> {
  // a `raw` node
  if (node instanceof Uint8Array) {
    queue.push(extractDataFromBlock(node, streamPosition, start, end))

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

        // create a sub-queue for this child
        const walkQueue = new PQueue({
          concurrency: 1
        })

        void walkQueue.add(async () => {
          await walkDAG(blockstore, child, queue, blockStart, start, end, walkQueue, options)
        })

        // wait for this child to complete before moving on to the next
        await walkQueue.onIdle()
      }
    }
  )
}

const fileContent: UnixfsV1Resolver = (cid, node, unixfs, path, resolve, depth, blockstore) => {
  async function * yieldFileContent (options: ExporterOptions = {}): UnixfsV1FileContent {
    const fileSize = unixfs.fileSize()

    if (fileSize === undefined) {
      throw new Error('File was a directory')
    }

    const {
      offset,
      length
    } = validateOffsetAndLength(fileSize, options.offset, options.length)

    if (length === 0n) {
      return
    }

    // use a queue to walk the DAG instead of recursion to ensure very deep DAGs
    // don't overflow the stack
    const walkQueue = new PQueue({
      concurrency: 1
    })
    const queue = pushable()

    void walkQueue.add(async () => {
      await walkDAG(blockstore, node, queue, 0n, offset, offset + length, walkQueue, options)
    })

    walkQueue.on('error', error => {
      queue.end(error)
    })

    let read = 0n

    for await (const buf of queue) {
      if (buf == null) {
        continue
      }

      read += BigInt(buf.byteLength)

      if (read === length) {
        queue.end()
      }

      yield buf
    }
  }

  return yieldFileContent
}

export default fileContent
