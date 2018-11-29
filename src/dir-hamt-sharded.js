'use strict'

const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const filter = require('pull-stream/throughs/filter')
const map = require('pull-stream/throughs/map')
const cat = require('pull-cat')

// Logic to export a unixfs directory.
module.exports = shardedDirExporter

function shardedDirExporter (cid, node, name, path, pathRest, resolve, size, dag, parent, depth, options) {
  let dir
  if (!parent || (parent.path !== path)) {
    dir = {
      name: name,
      depth: depth,
      path: path,
      multihash: cid.buffer,
      size: node.size,
      type: 'dir'
    }
  }

  // we are at the max depth so no need to descend into children
  if (options.maxDepth && options.maxDepth <= depth) {
    return values([dir])
  }

  const streams = [
    pull(
      values(node.links),
      map((link) => {
        // remove the link prefix (2 chars for the bucket index)
        const p = link.name.substring(2)
        const pp = p ? path + '/' + p : path
        let accept = true

        if (p && pathRest.length) {
          accept = (p === pathRest[0])
        }

        if (accept) {
          return {
            depth: p ? depth + 1 : depth,
            name: p,
            path: pp,
            multihash: link.cid.buffer,
            pathRest: p ? pathRest.slice(1) : pathRest,
            parent: dir || parent
          }
        } else {
          return ''
        }
      }),
      filter(Boolean),
      resolve
    )
  ]

  // place dir before if not specifying subtree
  if (!pathRest.length || options.fullPath) {
    streams.unshift(values([dir]))
  }

  return cat(streams)
}
