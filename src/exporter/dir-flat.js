'use strict'

const path = require('path')
const pull = require('pull-stream')
const paramap = require('pull-paramap')
const CID = require('cids')
const cat = require('pull-cat')

// Logic to export a unixfs directory.
module.exports = dirExporter

function dirExporter (node, name, pathRest, ipldResolver, resolve, parent) {
  const accepts = pathRest[0]

  const dir = {
    path: name,
    hash: node.multihash
  }

  const streams = [
    pull(
      pull.values(node.links),
      pull.map((link) => ({
        linkName: link.name,
        path: path.join(name, link.name),
        hash: link.multihash
      })),
      pull.filter((item) => accepts === undefined || item.linkName === accepts),
      paramap((item, cb) => ipldResolver.get(new CID(item.hash), (err, n) => {
        if (err) {
          return cb(err)
        }

        cb(null, resolve(n.value, accepts || item.path, pathRest, ipldResolver, name, parent))
      })),
      pull.flatten()
    )
  ]

  // place dir before if not specifying subtree
  if (!pathRest.length) {
    streams.unshift(pull.values([dir]))
  }

  pathRest.shift()

  return cat(streams)
}
