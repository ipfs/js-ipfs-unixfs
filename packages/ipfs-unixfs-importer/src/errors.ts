export class InvalidParametersError extends Error {
  static name = 'InvalidParametersError'
  static code = 'ERR_INVALID_PARAMS'
  name = InvalidParametersError.name
  code = InvalidParametersError.code

  constructor (message = 'Invalid parameters') {
    super(message)
  }
}

export class InvalidAvgChunkSizeError extends Error {
  static name = 'InvalidAvgChunkSizeError'
  static code = 'ERR_INVALID_AVG_CHUNK_SIZE'
  name = InvalidAvgChunkSizeError.name
  code = InvalidAvgChunkSizeError.code

  constructor (message = 'Invalid avg chunk size') {
    super(message)
  }
}

export class InvalidChunkSizeError extends Error {
  static name = 'InvalidChunkSizeError'
  static code = 'ERR_INVALID_CHUNK_SIZE'
  name = InvalidChunkSizeError.name
  code = InvalidChunkSizeError.code

  constructor (message = 'Invalid chunk size') {
    super(message)
  }
}

export class InvalidMinChunkSizeError extends Error {
  static name = 'InvalidMinChunkSizeError'
  static code = 'ERR_INVALID_MIN_CHUNK_SIZE'
  name = InvalidMinChunkSizeError.name
  code = InvalidMinChunkSizeError.code

  constructor (message = 'Invalid min chunk size') {
    super(message)
  }
}

export class InvalidContentError extends Error {
  static name = 'InvalidContentError'
  static code = 'ERR_INVALID_CONTENT'
  name = InvalidContentError.name
  code = InvalidContentError.code

  constructor (message = 'Invalid content') {
    super(message)
  }
}
