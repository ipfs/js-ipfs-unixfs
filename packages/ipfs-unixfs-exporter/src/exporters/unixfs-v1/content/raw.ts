import { CustomProgressEvent } from 'progress-events'
import { extractDataFromBlock } from '../../utils/extract-data-from-block.js'
import { validateOffsetAndLength } from '../../utils/validate-offset-and-length.js'
import type { ExporterOptions, ExportProgress, ExportWalk } from '../../../index.js'
import type { PBNode } from '@ipld/dag-pb'
import type { UnixFS } from 'ipfs-unixfs'
import type { CID } from 'multiformats'

export function rawContent (cid: CID, node: PBNode, unixfs: UnixFS): (options: ExporterOptions) => AsyncGenerator<Uint8Array> {
  async function * yieldRawContent (options: ExporterOptions = {}): AsyncGenerator<Uint8Array, void, undefined> {
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
