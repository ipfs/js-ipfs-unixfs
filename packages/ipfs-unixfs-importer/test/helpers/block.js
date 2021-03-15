'use strict'

const {
  DAGNode,
  util
} = require('ipld-dag-pb')
const multicodec = require('multicodec')
const mh = require('multihashing-async').multihash
const CID = require('cids')
const Block = require('ipld-block')

/**
 * @param {import('ipld')} ipld
 */
function createBlockApi (ipld) {
  // make ipld behave like the block api, some tests need to pull
  // data from ipld so can't use a simple in-memory cid->block map
  /** @type {import('../../src/types').BlockAPI} */
  const BlockApi = {
    put: async (buf, options) => {
      if (!options || !options.cid) {
        throw new Error('No cid passed')
      }

      const cid = new CID(options.cid)

      const multihash = mh.decode(cid.multihash)

      if (Block.isBlock(buf)) {
        buf = buf.data
      }

      /** @type {any} */
      let obj = buf

      if (cid.codec === 'dag-pb') {
        obj = util.deserialize(buf)
      }

      await ipld.put(obj, cid.codec === 'dag-pb' ? multicodec.DAG_PB : multicodec.RAW, {
        cidVersion: cid.version,
        hashAlg: multihash.code
      })

      return new Block(buf, cid)
    },
    get: async (cid, options) => {
      cid = new CID(cid)

      /** @type {Uint8Array} */
      let buf = await ipld.get(cid, options)

      if (buf instanceof DAGNode) {
        buf = buf.serialize()
      }

      return new Block(buf, cid)
    }
  }

  return BlockApi
}

module.exports = createBlockApi
