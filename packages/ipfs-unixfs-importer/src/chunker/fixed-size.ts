import { Uint8ArrayList } from 'uint8arraylist'
import type { Chunker } from './index.ts'

export interface FixedSizeOptions {
  chunkSize?: number
}

export const DEFAULT_CHUNK_SIZE_256KIB = 262_144
export const DEFAULT_CHUNK_SIZE_1MIB = 1_048_576

export const fixedSize = (options: FixedSizeOptions = {}): Chunker => {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE_256KIB

  return async function * fixedSizeChunker (source) {
    let list = new Uint8ArrayList()
    let currentLength = 0
    let emitted = false

    for await (const buffer of source) {
      list.append(buffer)

      currentLength += buffer.length

      while (currentLength >= chunkSize) {
        const buf = list.subarray(0, chunkSize)
        yield buf

        emitted = true

        // throw away consumed bytes
        if (chunkSize === list.length) {
          list = new Uint8ArrayList()
          currentLength = 0
        } else {
          const newBl = new Uint8ArrayList()
          newBl.append(list.sublist(chunkSize))
          list = newBl

          // update our offset
          currentLength -= chunkSize
        }
      }
    }

    if (!emitted || currentLength > 0) {
      // return any remaining bytes
      yield list.subarray(0, currentLength)
    }
  }
}
