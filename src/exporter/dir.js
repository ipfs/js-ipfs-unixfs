'use strict'

const path = require('path')
const pull = require('pull-stream')
const paramap = require('pull-paramap')
const CID = require('cids')
const cat = require('pull-cat')

const fileExporter = require('./file')
const switchType = require('../util').switchType

// Logic to export a unixfs directory.
module.exports = dirExporter

function dirExporter (node, name, ipldResolver) {
  // The algorithm below is as follows
  //
  // 1. Take all links from a given directory node
  // 2. Map each link to their full name (parent + link name) + hash
  // 3. Parallel map to
  // 3.1. Resolve the hash against the dagService
  // 3.2. Switch on the node type
  //      - `directory`: return node
  //      - `file`: use the fileExporter to load and return the file
  // 4. Flatten

  return pull(
    pull.values(node.links),
    pull.map((link) => ({
      path: path.join(name, link.name),
      hash: link.multihash
    })),
    paramap((item, cb) => ipldResolver.get(new CID(item.hash), (err, result) => {
      if (err) {
        return cb(err)
      }

      const dir = {
        path: item.path,
        size: item.size
      }

      const node = result.value

      cb(null, switchType(
        node,
        () => cat([pull.values([dir]), dirExporter(node, item.path, ipldResolver)]),
        () => fileExporter(node, item.path, ipldResolver)
      ))
    })),
    pull.flatten()
  )
}
