'use strict'

const waterfall = require('async/waterfall')
const dagPB = require('ipld-dag-pb')
const UnixFS = require('ipfs-unixfs')
const CID = require('cids')

const DAGLink = dagPB.DAGLink
const DAGNode = dagPB.DAGNode

module.exports = function (file, ipldResolver, options) {
  return function (leaves, callback) {
    if (leaves.length === 1 && (leaves[0].single || options.reduceSingleLeafToSelf)) {
      const leave = leaves[0]
      callback(null, {
        path: file.path,
        multihash: leave.multihash,
        size: leave.size,
        leafSize: leave.leafSize,
        name: leave.name
      })
      return // early
    }

    // create a parent node and add all the leafs
    const f = new UnixFS('file')

    const links = leaves.map((leaf) => {
      f.addBlockSize(leaf.leafSize)

      return new DAGLink(leaf.name, leaf.size, leaf.multihash)
    })

    waterfall([
      (cb) => DAGNode.create(f.marshal(), links, cb),
      (node, cb) => {
        if (options.onlyHash) return cb(null, node)

        ipldResolver.put(node, {
          cid: new CID(node.multihash)
        }, (err) => cb(err, node))
      }
    ], (err, node) => {
      if (err) {
        callback(err)
        return // early
      }

      const root = {
        name: '',
        path: file.path,
        multihash: node.multihash,
        size: node.size,
        leafSize: f.fileSize()
      }

      callback(null, root)
    })
  }
}
