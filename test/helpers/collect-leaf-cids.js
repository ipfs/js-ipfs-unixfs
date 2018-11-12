'use strict'

const pull = require('pull-stream')
const traverse = require('pull-traverse')
const CID = require('cids')

module.exports = (ipld, multihash, callback) => {
  pull(
    traverse.depthFirst(new CID(multihash), (cid) => {
      return pull(
        pull.values([cid]),
        pull.asyncMap((cid, callback) => {
          ipld.get(cid, (error, result) => {
            callback(error, !error && result.value)
          })
        }),
        pull.asyncMap((node, callback) => {
          if (!node.links) {
            return callback()
          }

          return callback(
            null, node.links.map(link => link.cid)
          )
        }),
        pull.filter(Boolean),
        pull.flatten()
      )
    }),
    pull.collect(callback)
  )
}
