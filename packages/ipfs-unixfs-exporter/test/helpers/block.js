'use strict'

const {
  DAGNode,
  util
} = require('ipld-dag-pb')
const multicodec = require('multicodec')
const mh = require('multihashing-async').multihash

/**
 * @param {import('ipfs-core-types/src/ipld').IPLD} ipld
 */
function createBlockApi (ipld) {
  // make ipld behave like the block api, some tests need to pull
  // data from ipld so can't use a simple in-memory cid->block map
  /** @type {import('ipfs-unixfs-importer').BlockAPI} */
  const BlockApi = {
    put: async (buf, { cid }) => {
      const multihash = mh.decode(cid.multihash)

      /** @type {any} */
      let obj = buf

      if (cid.codec === 'dag-pb') {
        obj = util.deserialize(buf)
      }

      await ipld.put(obj, cid.codec === 'dag-pb' ? multicodec.DAG_PB : multicodec.RAW, {
        cidVersion: cid.version,
        hashAlg: multihash.code
      })

      return { cid, data: buf }
    },
    get: async (cid, options) => {
      /** @type {Uint8Array} */
      let buf = await ipld.get(cid, options)

      if (buf instanceof DAGNode) {
        buf = buf.serialize()
      }

      return { cid, data: buf }
    }
  }

  return BlockApi
}

module.exports = createBlockApi
