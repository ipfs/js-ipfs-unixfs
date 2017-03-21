'use strict'

const path = require('path')
const pull = require('pull-stream')
const paramap = require('pull-paramap')
const CID = require('cids')
const cat = require('pull-cat')

// Logic to export a unixfs directory.
module.exports = dirExporter

function dirExporter (node, name, ipldResolver, resolve, parent) {
  const dir = {
    path: name,
    hash: node.multihash
  }

  return cat([
    pull.values([dir]),
    pull(
      pull.values(node.links),
      pull.map((link) => ({
        path: path.join(name, link.name),
        hash: link.multihash
      })),
      paramap((item, cb) => ipldResolver.get(new CID(item.hash), (err, n) => {
        if (err) {
          return cb(err)
        }

        cb(null, resolve(n.value, item.path, ipldResolver, name, parent))
      })),
      pull.flatten()
    )
  ])
}
