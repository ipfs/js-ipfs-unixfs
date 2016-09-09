'use strict'

const UnixFS = require('ipfs-unixfs')
const pull = require('pull-stream')

// Logic to export a single (possibly chunked) unixfs file.
module.exports = (node, name, ds) => {
  const file = UnixFS.unmarshal(node.data)
  let content

  if (node.links.length === 0) {
    content = pull.values([file.data])
  } else {
    content = pull(
      pull.values(node.links),
      pull.map((link) => ds.getStream(link.hash)),
      pull.flatten(),
      pull.map((node) => {
        try {
          const ex = UnixFS.unmarshal(node.data)
          return ex.data
        } catch (err) {
          console.error(node)
          throw new Error('Failed to unmarshal node')
        }
      })
    )
  }

  return pull.values([{
    content: content,
    path: name,
    size: file.fileSize()
  }])
}
