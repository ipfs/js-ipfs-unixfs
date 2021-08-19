import errCode from 'err-code'

/**
 * @typedef {import('../types').ImporterOptions} ImporterOptions
 * @typedef {import('../types').Chunker} Chunker
 */

/**
 * @param {string} key
 * @returns {Promise<Chunker|undefined>}
 */
const importChunkers = async (key) => {
  switch (key) {
    case 'fixed':
      return (await (import('./fixed-size.js'))).default
    case 'rabin':
      return (await (import('./rabin.js'))).default
    default:
  }
}

/**
 * @param {import('../types').ChunkerType} type
 * @param {AsyncIterable<Uint8Array>} source
 * @param {import('../types').ImporterOptions} options
 */
module.exports = async (type, source, options) => {
  const chunker = await importChunkers(type)

  if (!chunker) {
    throw errCode(new Error(`Unknkown chunker named ${type}`), 'ERR_UNKNOWN_CHUNKER')
  }

  return chunker(source, options)
}
