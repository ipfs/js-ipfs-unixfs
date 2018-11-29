'use strict'

const pull = require('pull-stream')
const cat = require('pull-cat')

// Logic to export a unixfs directory.
module.exports = dirExporter

function dirExporter (cid, node, name, path, pathRest, resolve, size, dag, parent, depth, options) {
  const accepts = pathRest[0]

  const dir = {
    name: name,
    depth: depth,
    path: path,
    multihash: cid.buffer,
    size: node.size,
    type: 'dir'
  }

  // we are at the max depth so no need to descend into children
  if (options.maxDepth && options.maxDepth <= depth) {
    return pull.values([dir])
  }

  const streams = [
    pull(
      pull.values(node.links),
      pull.filter((item) => accepts === undefined || item.name === accepts),
      pull.map((link) => ({
        depth: depth + 1,
        size: link.size,
        name: link.name,
        path: path + '/' + link.name,
        multihash: link.cid.buffer,
        linkName: link.name,
        pathRest: pathRest.slice(1),
        type: 'dir'
      })),
      resolve
    )
  ]

  // place dir before if not specifying subtree
  if (!pathRest.length || options.fullPath) {
    streams.unshift(pull.values([dir]))
  }

  return cat(streams)
}
