'use strict'

const UnixFS = require('ipfs-unixfs')
const pull = require('pull-stream')

function extractContent (node) {
  const raw = UnixFS.unmarshal(node.data)
  return pull.values([raw.data])
}

// Logic to export a single (possibly chunked) unixfs file.
module.exports = (node, name, ds) => {
  let content

  if (node.links.length === 0) {
    content = extractContent(node)
  } else {
    content = pull(
      pull.values(node.links),
      pull.map((link) => ds.getStream(link.hash)),
      pull.flatten(),
      pull.map(extractContent),
      pull.flatten()
    )
  }

  return pull.values([{
    content: content,
    path: name
  }])
}
