'use strict'

const errCode = require('err-code')

/**
 * @typedef {import('../types').ImporterOptions} ImporterOptions
 * @typedef {import('../types').Chunker} Chunker
 */

/**
 * @type {{ [key: string]: Chunker }}
 */
const chunkers = {
  fixed: require('../chunker/fixed-size'),
  rabin: require('../chunker/rabin')
}

/**
 * @param {import('../types').ChunkerType} type
 * @param {AsyncIterable<Uint8Array>} source
 * @param {import('../types').ImporterOptions} options
 */
module.exports = (type, source, options) => {
  const chunker = chunkers[type]

  if (!chunker) {
    throw errCode(new Error(`Unknkown chunker named ${type}`), 'ERR_UNKNOWN_CHUNKER')
  }

  return chunker(source, options)
}
