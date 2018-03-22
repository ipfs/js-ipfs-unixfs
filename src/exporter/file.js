'use strict'

const traverse = require('pull-traverse')
const traverseSlice = require('./traverse-slice')
const UnixFS = require('ipfs-unixfs')
const CID = require('cids')
const pull = require('pull-stream')
const paramap = require('pull-paramap')

// Logic to export a single (possibly chunked) unixfs file.
module.exports = (node, name, path, pathRest, resolve, size, dag, parent, depth, begin, end) => {
  function getData (node) {
    try {
      const file = UnixFS.unmarshal(node.data)
      return file.data || Buffer.alloc(0)
    } catch (err) {
      throw new Error('Failed to unmarshal node')
    }
  }

  function visitor (node) {
    return pull(
      pull.values(node.links),
      paramap((link, cb) => dag.get(new CID(link.multihash), cb)),
      pull.map((result) => result.value)
    )
  }

  const accepts = pathRest[0]

  if (accepts !== undefined && accepts !== path) {
    return pull.empty()
  }

  const file = UnixFS.unmarshal(node.data)
  const fileSize = size || file.fileSize()

  let content

  if (!isNaN(begin)) {
    content = traverseSlice(node, dag, begin, end)
  } else {
    content = pull(
      traverse.depthFirst(node, visitor),
      pull.map(getData)
    )
  }

  return pull.values([{
    depth: depth,
    content: content,
    name: name,
    path: path,
    hash: node.multihash,
    size: fileSize,
    type: 'file'
  }])
}
