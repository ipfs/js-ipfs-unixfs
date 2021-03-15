'use strict'

// @ts-ignore
const BufferList = require('bl/BufferList')

/**
 * @type {import('../types').Chunker}
 */
module.exports = async function * fixedSizeChunker (source, options) {
  let bl = new BufferList()
  let currentLength = 0
  let emitted = false
  const maxChunkSize = options.maxChunkSize

  for await (const buffer of source) {
    bl.append(buffer)

    currentLength += buffer.length

    while (currentLength >= maxChunkSize) {
      yield bl.slice(0, maxChunkSize)
      emitted = true

      // throw away consumed bytes
      if (maxChunkSize === bl.length) {
        bl = new BufferList()
        currentLength = 0
      } else {
        const newBl = new BufferList()
        newBl.append(bl.shallowSlice(maxChunkSize))
        bl = newBl

        // update our offset
        currentLength -= maxChunkSize
      }
    }
  }

  if (!emitted || currentLength) {
    // return any remaining bytes or an empty buffer
    yield bl.slice(0, currentLength)
  }
}
