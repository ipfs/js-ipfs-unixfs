'use strict'

const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const filter = require('pull-stream/throughs/filter')
const map = require('pull-stream/throughs/map')
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
    return values([dir])
  }

  const streams = [
    pull(
      values(node.links),
      filter((item) => accepts === undefined || item.name === accepts),
      map((link) => ({
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
    streams.unshift(values([dir]))
  }

  return cat(streams)
}
