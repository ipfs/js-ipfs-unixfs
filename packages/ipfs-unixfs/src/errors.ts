export class InvalidTypeError extends Error {
  static name = 'InvalidTypeError'
  static code = 'ERR_INVALID_TYPE'
  name = InvalidTypeError.name
  code = InvalidTypeError.code

  constructor (message = 'Invalid type') {
    super(message)
  }
}

export class InvalidUnixFSMessageError extends Error {
  static name = 'InvalidUnixFSMessageError'
  static code = 'ERR_INVALID_MESSAGE'
  name = InvalidUnixFSMessageError.name
  code = InvalidUnixFSMessageError.code

  constructor (message = 'Invalid message') {
    super(message)
  }
}
