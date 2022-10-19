import { Uint8ArrayList } from 'uint8arraylist'

/**
 * @type {import('../types').Chunker}
 */
async function * fixedSizeChunker (source, options) {
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

  if (!emitted || currentLength) {
    // return any remaining bytes or an empty buffer
    yield list.subarray(0, currentLength)
  }
}

export default fixedSizeChunker
