'use strict'

const path = require('path')
const pull = require('pull-stream')

const fileExporter = require('./file')
const switchType = require('../util').switchType

// Logic to export a unixfs directory.
module.exports = (node, name, dagService) => {
  return pull(
    pull.values(node.links),
    pull.map((link) => ({
      path: path.join(name, link.name),
      hash: link.hash
    })),
    pull.map((item) => pull(
      dagService.getStream(item.hash),
      pull.map((n) => switchType(
        n,
        () => pull.values([item]),
        () => fileExporter(n, item.path, dagService)
      )),
      pull.flatten()
    )),
    pull.flatten()
  )
}
