'use strict'

const errCode = require('err-code')
const uint8ArrayFromString = require('uint8arrays/from-string')

/**
 * @typedef {import('../types').ChunkValidator} ChunkValidator
 */

/**
 * @type {ChunkValidator}
 */
async function * validateChunks (source) {
  for await (const content of source) {
    if (content.length === undefined) {
      throw errCode(new Error('Content was invalid'), 'ERR_INVALID_CONTENT')
    }

    if (typeof content === 'string' || content instanceof String) {
      yield uint8ArrayFromString(content.toString())
    } else if (Array.isArray(content)) {
      yield Uint8Array.from(content)
    } else if (content instanceof Uint8Array) {
      yield content
    } else {
      throw errCode(new Error('Content was invalid'), 'ERR_INVALID_CONTENT')
    }
  }
}

module.exports = validateChunks
