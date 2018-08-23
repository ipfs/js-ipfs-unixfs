'use strict'

module.exports = function extractDataFromBlock (block, streamPosition, begin, end) {
  const blockLength = block.length

  if (begin >= streamPosition + blockLength) {
    // If begin is after the start of the block, return an empty block
    // This can happen when internal nodes contain data
    return Buffer.alloc(0)
  }

  if (end - streamPosition < blockLength) {
    // If the end byte is in the current block, truncate the block to the end byte
    block = block.slice(0, end - streamPosition)
  }

  if (begin > streamPosition && begin < (streamPosition + blockLength)) {
    // If the start byte is in the current block, skip to the start byte
    block = block.slice(begin - streamPosition)
  }

  return block
}
