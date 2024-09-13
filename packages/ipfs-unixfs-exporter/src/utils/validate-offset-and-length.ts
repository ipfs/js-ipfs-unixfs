import { InvalidParametersError } from '../errors.js'

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
    throw new InvalidParametersError('Offset must be greater than or equal to 0')
  }

  if (start > fileSize) {
    throw new InvalidParametersError('Offset must be less than the file size')
  }

  if (end < 0n) {
    throw new InvalidParametersError('Length must be greater than or equal to 0')
  }

  if (end > fileSize) {
    throw new InvalidParametersError('Length must be less than the file size')
  }

  return {
    start,
    end
  }
}

export default validateOffsetAndLength
