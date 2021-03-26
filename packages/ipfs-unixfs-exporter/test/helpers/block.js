'use strict'

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
        const error = new Error(`Couold not find data for CID '${cid}'`)
        // @ts-ignore - TODO vmx 2021-03-24: Should the error type be wrapped in a custom type?
        error.code = 'ERR_NOT_FOUND'
        throw(error)
      }

      return { cid, bytes }
    }
  }

  return BlockApi
}

module.exports = createBlockApi
