import errCode from 'err-code'

const validateOffsetAndLength = (size: number | bigint, offset: number | bigint = 0, length: number | bigint = size): { start: bigint, end: bigint } => {
  const fileSize = BigInt(size)
  const start = BigInt(offset ?? 0)
  let end = BigInt(length)

  if (end !== fileSize) {
    end = start + end
  }

  if (end > fileSize) {
    end = fileSize
  }

  if (start < 0n) {
    throw errCode(new Error('Offset must be greater than or equal to 0'), 'ERR_INVALID_PARAMS')
  }

  if (start > fileSize) {
    throw errCode(new Error('Offset must be less than the file size'), 'ERR_INVALID_PARAMS')
  }

  if (end < 0n) {
    throw errCode(new Error('Length must be greater than or equal to 0'), 'ERR_INVALID_PARAMS')
  }

  if (end > fileSize) {
    throw errCode(new Error('Length must be less than the file size'), 'ERR_INVALID_PARAMS')
  }

  return {
    start,
    end
  }
}

export default validateOffsetAndLength
