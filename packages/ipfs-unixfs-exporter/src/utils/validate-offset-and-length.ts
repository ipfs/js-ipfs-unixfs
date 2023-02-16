import errCode from 'err-code'

const validateOffsetAndLength = (size: number | bigint, offset: number | bigint = 0, length: number | bigint = size): { offset: bigint, length: bigint } => {
  offset = BigInt(offset ?? 0)
  length = BigInt(length ?? size)

  if (offset == null) {
    offset = 0n
  }

  if (offset < 0n) {
    throw errCode(new Error('Offset must be greater than or equal to 0'), 'ERR_INVALID_PARAMS')
  }

  if (offset > size) {
    throw errCode(new Error('Offset must be less than the file size'), 'ERR_INVALID_PARAMS')
  }

  if (length == null) {
    length = BigInt(size) - offset
  }

  if (length < 0n) {
    throw errCode(new Error('Length must be greater than or equal to 0'), 'ERR_INVALID_PARAMS')
  }

  if (offset + length > size) {
    length = BigInt(size) - offset
  }

  return {
    offset,
    length
  }
}

export default validateOffsetAndLength
