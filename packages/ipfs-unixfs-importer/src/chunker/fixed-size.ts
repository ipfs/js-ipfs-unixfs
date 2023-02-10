import { Uint8ArrayList } from 'uint8arraylist'
import type { Chunker } from '../index.js'

export const fixedSize: Chunker = async function * (source, options) {
  let list = new Uint8ArrayList()
  let currentLength = 0
  let emitted = false
  const maxChunkSize = options.maxChunkSize

  for await (const buffer of source) {
    list.append(buffer)

    currentLength += buffer.length

    while (currentLength >= maxChunkSize) {
      yield list.slice(0, maxChunkSize)
      emitted = true

      // throw away consumed bytes
      if (maxChunkSize === list.length) {
        list = new Uint8ArrayList()
        currentLength = 0
      } else {
        const newBl = new Uint8ArrayList()
        newBl.append(list.sublist(maxChunkSize))
        list = newBl

        // update our offset
        currentLength -= maxChunkSize
      }
    }
  }

  if (!emitted || currentLength > 0) {
    // return any remaining bytes
    yield list.subarray(0, currentLength)
  }
}
