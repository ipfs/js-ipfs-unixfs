import { CustomProgressEvent } from 'progress-events'
import extractDataFromBlock from '../../../utils/extract-data-from-block.js'
import validateOffsetAndLength from '../../../utils/validate-offset-and-length.js'
import type { ExporterOptions, ExportProgress, ExportWalk, UnixfsV1Resolver } from '../../../index.js'

const rawContent: UnixfsV1Resolver = (cid, node, unixfs, path, resolve, depth, blockstore) => {
  function * yieldRawContent (options: ExporterOptions = {}): Generator<Uint8Array, void, undefined> {
    if (unixfs.data == null) {
      throw new Error('Raw block had no data')
    }

    const size = unixfs.data.length

    const {
      start,
      end
    } = validateOffsetAndLength(size, options.offset, options.length)

    options.onProgress?.(new CustomProgressEvent<ExportWalk>('unixfs:exporter:walk:raw', {
      cid
    }))

    const buf = extractDataFromBlock(unixfs.data, 0n, start, end)

    options.onProgress?.(new CustomProgressEvent<ExportProgress>('unixfs:exporter:progress:unixfs:raw', {
      bytesRead: BigInt(buf.byteLength),
      totalBytes: end - start,
      fileSize: BigInt(unixfs.data.byteLength)
    }))

    yield buf
  }

  return yieldRawContent
}

export default rawContent
