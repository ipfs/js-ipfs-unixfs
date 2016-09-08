'use strict'

const UnixFS = require('ipfs-unixfs')
const pull = require('pull-stream')

function extractContent (node) {
  return UnixFS.unmarshal(node.data).data
}

// Logic to export a single (possibly chunked) unixfs file.
module.exports = (node, name, ds) => {
  let content

  if (node.links.length === 0) {
    const c = extractContent(node)
    content = pull.values([c])
  } else {
    content = pull(
      pull.values(node.links),
      pull.map((link) => ds.getStream(link.hash)),
      pull.flatten(),
      pull.map(extractContent)
    )
  }

  return pull.values([{
    content: content,
    path: name
  }])
}
