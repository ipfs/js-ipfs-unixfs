'use strict'

const path = require('path')
const pull = require('pull-stream')
const paramap = require('pull-paramap')
const CID = require('cids')
const cat = require('pull-cat')
const cleanHash = require('./clean-multihash')

// Logic to export a unixfs directory.
module.exports = shardedDirExporter

function shardedDirExporter (node, name, ipldResolver, resolve, parent) {
  let dir
  if (!parent || parent.path !== name) {
    dir = [{
      path: name,
      hash: cleanHash(node.multihash)
    }]
  }

  return cat([
    pull.values(dir),
    pull(
      pull.values(node.links),
      pull.map((link) => {
        // remove the link prefix (2 chars for the bucket index)
        let p = link.name.substring(2)
        // another sharded dir or file?
        p = p ? path.join(name, p) : name

        return {
          name: link.name,
          path: p,
          hash: link.multihash
        }
      }),
      paramap((item, cb) => ipldResolver.get(new CID(item.hash), (err, n) => {
        if (err) {
          return cb(err)
        }

        cb(null, resolve(n.value, item.path, ipldResolver, (dir && dir[0]) || parent))
      })),
      pull.flatten()
    )
  ])
}
