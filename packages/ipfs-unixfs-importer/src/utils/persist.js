'use strict'

const mc = require('multicodec')
const { CID } = require('multiformats/cid')

/**
 * @param {Uint8Array} buffer
 * @param {import('../types').BlockAPI} block
 * @param {import('../types').PersistOptions} options
 */
const persist = async (buffer, block, options) => {
  if (!options.hasher) {
    throw new Error(`Hasher must be specified.`)
  }

  if (!options.codec) {
    options.codec = mc.DAG_PB
  }

  if (options.cidVersion === undefined) {
    options.cidVersion = 1
  }

  const multihash = await options.hasher.digest(buffer)
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
