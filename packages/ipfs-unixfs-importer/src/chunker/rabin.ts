import errcode from 'err-code'
// @ts-expect-error no types
import { create } from 'rabin-wasm'
import { Uint8ArrayList } from 'uint8arraylist'
import type { Chunker } from './index.js'

const DEFAULT_MIN_CHUNK_SIZE = 262144
const DEFAULT_MAX_CHUNK_SIZE = 262144
const DEFAULT_AVG_CHUNK_SIZE = 262144
const DEFAULT_WINDOW = 16

async function * chunker (source: AsyncIterable<Uint8Array>, r: any): AsyncGenerator<Uint8Array> {
  const buffers = new Uint8ArrayList()

  for await (const chunk of source) {
    buffers.append(chunk)

    const sizes = r.fingerprint(chunk)

    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i]
      const buf = buffers.slice(0, size)
      buffers.consume(size)

      yield buf
    }
  }

  if (buffers.length > 0) {
    yield buffers.subarray(0)
  }
}

export interface RabinOptions {
  minChunkSize?: number
  maxChunkSize?: number
  avgChunkSize?: number
  window?: number
}

export const rabin = (options: RabinOptions = {}): Chunker => {
  let min = options.minChunkSize ?? DEFAULT_MIN_CHUNK_SIZE
  let max = options.maxChunkSize ?? DEFAULT_MAX_CHUNK_SIZE
  let avg = options.avgChunkSize ?? DEFAULT_AVG_CHUNK_SIZE
  const window = options.window ?? DEFAULT_WINDOW

  // if only avg was passed, calculate min/max from that
  if (options.avgChunkSize != null && options.minChunkSize == null && options.maxChunkSize == null) {
    min = avg / 3
    max = avg + (avg / 2)
  }

  if (options.avgChunkSize == null && options.minChunkSize == null && options.maxChunkSize == null) {
    throw errcode(new Error('please specify an average chunk size'), 'ERR_INVALID_AVG_CHUNK_SIZE')
  }

  // validate min/max/avg in the same way as go
  if (min < 16) {
    throw errcode(new Error('rabin min must be greater than 16'), 'ERR_INVALID_MIN_CHUNK_SIZE')
  }

  if (max < min) {
    max = min
  }

  if (avg < min) {
    avg = min
  }

  const sizepow = Math.floor(Math.log2(avg))

  return async function * rabinChunker (source) {
    const r = await create(sizepow, min, max, window)

    for await (const chunk of chunker(source, r)) {
      yield chunk
    }
  }
}
