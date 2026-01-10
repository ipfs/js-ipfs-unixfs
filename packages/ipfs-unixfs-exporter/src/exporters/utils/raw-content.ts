import { CustomProgressEvent } from 'progress-events'
import { extractDataFromBlock } from './extract-data-from-block.js'
import { validateOffsetAndLength } from './validate-offset-and-length.js'
import type { ExporterOptions, ExportProgress } from '../../index.js'

export function rawContent (node: Uint8Array, event: string): ((options?: ExporterOptions) => AsyncGenerator<Uint8Array, void, undefined>) {
  async function * contentGenerator (options: ExporterOptions = {}): AsyncGenerator<Uint8Array, void, undefined> {
    const {
      start,
      end
    } = validateOffsetAndLength(node.length, options.offset, options.length)

    const buf = extractDataFromBlock(node, 0n, start, end)

    options.onProgress?.(new CustomProgressEvent<ExportProgress>(event, {
      bytesRead: BigInt(buf.byteLength),
      totalBytes: end - start,
      fileSize: BigInt(node.byteLength)
    }))

    yield buf
  }

  return contentGenerator
}
