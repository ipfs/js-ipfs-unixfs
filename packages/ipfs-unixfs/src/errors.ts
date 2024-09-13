export class InvalidTypeError extends Error {
  static name = 'InvalidTypeError'
  static code = 'ERR_INVALID_TYPE'
  name = InvalidTypeError.name
  code = InvalidTypeError.code

  constructor (message = 'Invalid type') {
    super(message)
  }
}
