'use strict'

const mc = require('multicodec')
const { sha256 } = require('multiformats/hashes/sha2')
const CID = require('multiformats/cid')

/**
 * @param {Uint8Array} buffer
 * @param {import('../types').BlockAPI} block
 * @param {import('../types').PersistOptions} options
 */
const persist = async (buffer, block, options) => {
  if (!options.codec) {
    options.codec = mc.DAG_PB
  }

  if (!options.cidVersion) {
    options.cidVersion = 0
  }

  if (!options.hashAlg) {
    options.hashAlg = mc.SHA2_256
  }

  if (options.hashAlg !== mc.SHA2_256) {
    options.cidVersion = 1
  }

  let multihash
  switch (options.hashAlg) {
    case mc.SHA2_256:
      multihash = await sha256.digest(buffer)
      break
    default:
      throw(`TODO vmx 2021-02-24: support other hash algorithms. ${options.hashAlg} not found.`)
  }
  // TODO vmx 2021-02-24: no idea why TypeScript fails here, it should work
  // @ts-ignore
  const cid = CID.create(options.cidVersion, options.codec, multihash)

  if (!options.onlyHash) {
    await block.put({
      // @ts-ignore TODO vmx 2021-03-17
      bytes: buffer,
      cid
    }, {
      // @ts-ignore pin option is missing from block api typedefs
      pin: options.pin,
      preload: options.preload,
      timeout: options.timeout,
    })
  }

  return cid
}

module.exports = persist
