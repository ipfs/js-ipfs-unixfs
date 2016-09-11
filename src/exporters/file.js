'use strict'

const traverse = require('pull-traverse')
const UnixFS = require('ipfs-unixfs')
const pull = require('pull-stream')

// Logic to export a single (possibly chunked) unixfs file.
module.exports = (node, name, ds) => {
  function getData (node) {
    try {
      const file = UnixFS.unmarshal(node.data)
      return file.data || new Buffer(0)
    } catch (err) {
      throw new Error('Failed to unmarshal node')
    }
  }

  function visitor (node) {
    return pull(
      pull.values(node.links),
      pull.map((link) => ds.getStream(link.hash)),
      pull.flatten()
    )
  }

  let content = pull(
    traverse.depthFirst(node, visitor),
    pull.map(getData)
  )

  const file = UnixFS.unmarshal(node.data)
  return pull.values([{
    content: content,
    path: name,
    size: file.fileSize()
  }])
}
