'use strict'

const errCode = require('err-code')

// make sure the content only emits buffer-a-likes
async function * validateChunks (source) {
  for await (const content of source) {
    if (content.length === undefined) {
      throw errCode(new Error('Content was invalid'), 'ERR_INVALID_CONTENT')
    }

    if (typeof content === 'string' || content instanceof String) {
      yield Buffer.from(content, 'utf8')
    } else if (Array.isArray(content)) {
      yield Buffer.from(content)
    } else {
      yield content
    }
  }
}

module.exports = validateChunks
