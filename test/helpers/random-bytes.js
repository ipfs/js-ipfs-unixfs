'use strict'

module.exports = function randomBytes (length) {
  const buffer = Buffer.alloc(length)

  for (let i = 0; i < length; i++) {
    buffer[i] = Math.floor(Math.random() * 256) + 1
  }

  return buffer
}
