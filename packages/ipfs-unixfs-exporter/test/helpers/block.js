'use strict'

const errCode = require('err-code')

function createBlockApi () {
  /** @type {{[key: string]: Uint8Array}} */
  const blocks = {}

  /** @type {import('ipfs-unixfs-importer').BlockAPI} */
  const BlockApi = {
    put: async ({ cid, bytes }, options) => {
      if (!options || !options.onlyHash) {
        blocks[cid.toV1().toString()] = bytes
      }

      return { cid, bytes }
    },
    get: async (cid, _options) => {
      const bytes = blocks[cid.toV1().toString()]
      if (bytes === undefined) {
        throw errCode(new Error(`Couold not find data for CID '${cid}'`), 'ERR_NOT_FOUND')
      }

      return { cid, bytes }
    }
  }

  return BlockApi
}

module.exports = createBlockApi
