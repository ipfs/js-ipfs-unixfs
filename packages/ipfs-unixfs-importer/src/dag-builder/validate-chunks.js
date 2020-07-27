'use strict'

const errCode = require('err-code')
const utf8Encoder = require('../utils/utf8-encoder')

// make sure the content only emits buffer-a-likes
async function * validateChunks (source) {
  for await (const content of source) {
    if (content.length === undefined) {
      throw errCode(new Error('Content was invalid'), 'ERR_INVALID_CONTENT')
    }

    if (typeof content === 'string' || content instanceof String) {
      yield utf8Encoder.encode(content)
    } else if (Array.isArray(content)) {
      yield Uint8Array.from(content)
    } else {
      yield content
    }
  }
}

module.exports = validateChunks
