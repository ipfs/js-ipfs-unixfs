'use strict'

const { Buffer } = require('buffer')

module.exports = function (cid, ipld) {
  async function * traverse (cid) {
    const node = await ipld.get(cid)

    if (Buffer.isBuffer(node) || !node.Links.length) {
      yield {
        node,
        cid
      }

      return
    }

    node.Links.forEach(link => traverse(link.Hash))
  }

  return traverse(cid)
}
