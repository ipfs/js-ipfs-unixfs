'use strict'

const DAG_PB = require('ipld-dag-pb')
const multicodec = require('multicodec')
const mh = require('multihashing-async').multihash

module.exports = (ipld) => {
  // make ipld behave like the block api, some tests need to pull
  // data from ipld so can't use a simple in-memory cid->block map
  return {
    put: async (buf, { cid }) => {
      const multihash = mh.decode(cid.multihash)

      if (cid.codec === 'dag-pb') {
        buf = DAG_PB.util.deserialize(buf)
      }

      await ipld.put(buf, cid.codec === 'dag-pb' ? multicodec.DAG_PB : multicodec.RAW, {
        cidVersion: cid.version,
        hashAlg: multihash.code
      })

      return { cid, data: buf }
    },
    get: async (cid, options) => {
      const node = await ipld.get(cid, options)

      if (cid.codec === 'dag-pb') {
        return node.serialize()
      }

      return { cid, data: node }
    }
  }
}
