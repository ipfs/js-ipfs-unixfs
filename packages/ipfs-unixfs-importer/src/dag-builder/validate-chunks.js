'use strict'

const errCode = require('err-code')
const uint8ArrayFromString = require('uint8arrays/from-string')

// make sure the content only emits buffer-a-likes
async function * validateChunks (source) {
  for await (const content of source) {
    if (content.length === undefined) {
      throw errCode(new Error('Content was invalid'), 'ERR_INVALID_CONTENT')
    }

    if (typeof content === 'string' || content instanceof String) {
      yield uint8ArrayFromString(content)
    } else if (Array.isArray(content)) {
      yield Uint8Array.from(content)
    } else {
      yield content
    }
  }
}

module.exports = validateChunks
