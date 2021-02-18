'use strict'

const mh = require('multihashing-async')
const CID = require('cids')

/**
 * @param {Uint8Array} buffer
 * @param {import('../').BlockAPI} block
 * @param {import('../').ImporterOptions} options
 */
const persist = async (buffer, block, options) => {
  if (!options.codec) {
    options.codec = 'dag-pb'
  }

  if (!options.cidVersion) {
    options.cidVersion = 0
  }

  if (!options.hashAlg) {
    options.hashAlg = 'sha2-256'
  }

  if (options.hashAlg !== 'sha2-256') {
    options.cidVersion = 1
  }

  const multihash = await mh(buffer, options.hashAlg)
  const cid = new CID(options.cidVersion, options.codec, multihash)

  if (!options.onlyHash) {
    await block.put(buffer, {
      pin: options.pin,
      preload: options.preload,
      timeout: options.timeout,
      cid
    })
  }

  return cid
}

module.exports = persist
