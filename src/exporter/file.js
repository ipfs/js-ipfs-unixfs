'use strict'

const traverse = require('pull-traverse')
const UnixFS = require('ipfs-unixfs')
const CID = require('cids')
const pull = require('pull-stream')
const paramap = require('pull-paramap')

// Logic to export a single (possibly chunked) unixfs file.
module.exports = (node, name, ipldResolver) => {
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
      paramap((link, cb) => ipldResolver.get(new CID(link.multihash), cb))
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
