'use strict'

const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const asyncMap = require('pull-stream/throughs/async-map')
const filter = require('pull-stream/throughs/filter')
const flatten = require('pull-stream/throughs/flatten')
const collect = require('pull-stream/sinks/collect')
const traverse = require('pull-traverse')
const CID = require('cids')

module.exports = (ipld, multihash, callback) => {
  pull(
    traverse.depthFirst(new CID(multihash), (cid) => {
      return pull(
        values([cid]),
        asyncMap((cid, callback) => {
          ipld.get(cid, (error, result) => {
            callback(error, !error && result.value)
          })
        }),
        asyncMap((node, callback) => {
          if (!node.links) {
            return callback()
          }

          return callback(
            null, node.links.map(link => link.cid)
          )
        }),
        filter(Boolean),
        flatten()
      )
    }),
    collect(callback)
  )
}
