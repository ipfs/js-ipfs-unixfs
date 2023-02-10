
function extractDataFromBlock (block: Uint8Array, blockStart: bigint, requestedStart: bigint, requestedEnd: bigint): Uint8Array {
  const blockLength = BigInt(block.length)
  const blockEnd = BigInt(blockStart + blockLength)

  if (requestedStart >= blockEnd || requestedEnd < blockStart) {
    // If we are looking for a byte range that is starts after the start of the block,
    // return an empty block.  This can happen when internal nodes contain data
    return new Uint8Array(0)
  }

  if (requestedEnd >= blockStart && requestedEnd < blockEnd) {
    // If the end byte is in the current block, truncate the block to the end byte
    block = block.subarray(0, Number(requestedEnd - blockStart))
  }

  if (requestedStart >= blockStart && requestedStart < blockEnd) {
    // If the start byte is in the current block, skip to the start byte
    block = block.subarray(Number(requestedStart - blockStart))
  }

  return block
}

export default extractDataFromBlock
