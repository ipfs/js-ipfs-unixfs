'use strict'

const errCode = require('err-code')
const { BlockstoreAdapter } = require('interface-blockstore')
const { base58btc } = require('multiformats/bases/base58')

/**
 * @typedef {import('multiformats/cid').CID} CID
 */

function createBlockApi () {
  class MockBlockstore extends BlockstoreAdapter {
    constructor () {
      super()

      /** @type {{[key: string]: Uint8Array}} */
      this._blocks = {}
    }

    /**
     * @param {CID} cid
     * @param {Uint8Array} block
     * @param {any} [options]
     */
    async put (cid, block, options = {}) {
      this._blocks[base58btc.encode(cid.multihash.bytes)] = block
    }

    /**
     * @param {CID} cid
     * @param {any} [options]
     */
    async get (cid, options = {}) {
      const bytes = this._blocks[base58btc.encode(cid.multihash.bytes)]

      if (bytes === undefined) {
        throw errCode(new Error(`Could not find data for CID '${cid}'`), 'ERR_NOT_FOUND')
      }

      return bytes
    }
  }

  /** @type {import('interface-blockstore').Blockstore} */
  const bs = new MockBlockstore()

  return bs
}

module.exports = createBlockApi
