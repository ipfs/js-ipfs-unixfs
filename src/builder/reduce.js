'use strict'

const waterfall = require('async/waterfall')
const dagPB = require('ipld-dag-pb')
const UnixFS = require('ipfs-unixfs')
const persist = require('../utils/persist')

const DAGLink = dagPB.DAGLink
const DAGNode = dagPB.DAGNode

module.exports = function reduce (file, ipld, options) {
  return function (leaves, callback) {
    if (leaves.length === 1 && leaves[0].single && options.reduceSingleLeafToSelf) {
      const leaf = leaves[0]

      return callback(null, {
        size: leaf.size,
        leafSize: leaf.leafSize,
        multihash: leaf.multihash,
        path: file.path,
        name: leaf.name
      })
    }

    // create a parent node and add all the leaves
    const f = new UnixFS('file')

    const links = leaves.map((leaf) => {
      f.addBlockSize(leaf.leafSize)

      return new DAGLink(leaf.name, leaf.size, leaf.multihash)
    })

    waterfall([
      (cb) => DAGNode.create(f.marshal(), links, cb),
      (node, cb) => persist(node, ipld, options, cb)
    ], (error, result) => {
      if (error) {
        return callback(error)
      }

      callback(null, {
        size: result.node.size,
        leafSize: f.fileSize(),
        multihash: result.cid.buffer,
        path: file.path,
        name: ''
      })
    })
  }
}
