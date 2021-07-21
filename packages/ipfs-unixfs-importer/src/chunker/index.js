import errCode from 'err-code'

// TODO: lazy load
import rabinChunker from './rabin.js'
import fixedSizeChunker from './fixed-size.js'

/**
 * @typedef {import('../types').ImporterOptions} ImporterOptions
 * @typedef {import('../types').Chunker} Chunker
 */

/**
 * @type {{ [key: string]: Chunker }}
 */
const chunkers = {
  fixed: fixedSizeChunker,
  rabin: rabinChunker
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
