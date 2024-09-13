export class BadPathError extends Error {
  static name = 'BadPathError'
  static code = 'ERR_BAD_PATH'
  name = BadPathError.name
  code = BadPathError.code

  constructor (message = 'Bad path') {
    super(message)
  }
}

export class NotFoundError extends Error {
  static name = 'NotFoundError'
  static code = 'ERR_NOT_FOUND'
  name = NotFoundError.name
  code = NotFoundError.code

  constructor (message = 'Not found') {
    super(message)
  }
}

export class NoResolverError extends Error {
  static name = 'NoResolverError'
  static code = 'ERR_NO_RESOLVER'
  name = NoResolverError.name
  code = NoResolverError.code

  constructor (message = 'No resolver') {
    super(message)
  }
}

export class NotUnixFSError extends Error {
  static name = 'NotUnixFSError'
  static code = 'ERR_NOT_UNIXFS'
  name = NotUnixFSError.name
  code = NotUnixFSError.code

  constructor (message = 'Not UnixFS') {
    super(message)
  }
}

export class OverReadError extends Error {
  static name = 'OverReadError'
  static code = 'ERR_OVER_READ'
  name = OverReadError.name
  code = OverReadError.code

  constructor (message = 'Over read') {
    super(message)
  }
}

export class UnderReadError extends Error {
  static name = 'UnderReadError'
  static code = 'ERR_UNDER_READ'
  name = UnderReadError.name
  code = UnderReadError.code

  constructor (message = 'Under read') {
    super(message)
  }
}

export class NoPropError extends Error {
  static name = 'NoPropError'
  static code = 'ERR_NO_PROP'
  name = NoPropError.name
  code = NoPropError.code

  constructor (message = 'No Property found') {
    super(message)
  }
}

export class InvalidParametersError extends Error {
  static name = 'InvalidParametersError'
  static code = 'ERR_INVALID_PARAMS'
  name = InvalidParametersError.name
  code = InvalidParametersError.code

  constructor (message = 'Invalid parameters') {
    super(message)
  }
}
