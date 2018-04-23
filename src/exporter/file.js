'use strict'

const traverse = require('pull-traverse')
const UnixFS = require('ipfs-unixfs')
const CID = require('cids')
const pull = require('pull-stream')
const paramap = require('pull-paramap')

// Logic to export a single (possibly chunked) unixfs file.
module.exports = (node, name, path, pathRest, resolve, size, dag, parent, depth, offset, length) => {
  const accepts = pathRest[0]

  if (accepts !== undefined && accepts !== path) {
    return pull.empty()
  }

  const file = UnixFS.unmarshal(node.data)
  const fileSize = size || file.fileSize()

  if (offset < 0) {
    return pull.error(new Error('Offset must be greater than 0'))
  }

  if (offset > fileSize) {
    return pull.error(new Error('Offset must be less than the file size'))
  }

  if (length < 0) {
    return pull.error(new Error('Length must be greater than or equal to 0'))
  }

  if (length === 0) {
    return pull.empty()
  }

  if (!offset) {
    offset = 0
  }

  if (!length || (offset + length > fileSize)) {
    length = fileSize - offset
  }

  const content = streamBytes(dag, node, fileSize, offset, length)

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

function streamBytes (dag, node, fileSize, offset, length) {
  if (offset === fileSize || length === 0) {
    return pull.empty()
  }

  const end = offset + length
  let streamPosition = 0

  function getData ({ node, start }) {
    if (!node || !node.data) {
      return
    }

    try {
      const file = UnixFS.unmarshal(node.data)

      if (!file.data) {
        return
      }

      const block = extractDataFromBlock(file.data, start, offset, end)

      streamPosition += block.length

      return block
    } catch (error) {
      throw new Error(`Failed to unmarshal node - ${error.message}`)
    }
  }

  function visitor ({ node }) {
    const file = UnixFS.unmarshal(node.data)

    // work out which child nodes contain the requested data
    const filteredLinks = node.links
      .map((link, index) => {
        const child = {
          link: link,
          start: streamPosition,
          end: streamPosition + file.blockSizes[index]
        }

        streamPosition = child.end

        return child
      })
      .filter((child, index) => {
        return (offset >= child.start && offset < child.end) || // child has offset byte
          (end > child.start && end <= child.end) || // child has end byte
          (offset < child.start && end > child.end) // child is between offset and end bytes
      })

    if (filteredLinks.length) {
      // move stream position to the first node we're going to return data from
      streamPosition = filteredLinks[0].start
    }

    return pull(
      pull.values(filteredLinks),
      paramap((child, cb) => {
        dag.get(new CID(child.link.multihash), (error, result) => cb(error, {
          start: child.start,
          end: child.end,
          node: result && result.value,
          size: child.size
        }))
      })
    )
  }

  return pull(
    traverse.depthFirst({
      node,
      start: 0,
      end: fileSize
    }, visitor),
    pull.map(getData),
    pull.filter(Boolean)
  )
}

function extractDataFromBlock (block, streamPosition, begin, end) {
  const blockLength = block.length

  if (end - streamPosition < blockLength) {
    // If the end byte is in the current block, truncate the block to the end byte
    block = block.slice(0, end - streamPosition)
  }

  if (begin > streamPosition && begin < (streamPosition + blockLength)) {
    // If the start byte is in the current block, skip to the start byte
    block = block.slice(begin - streamPosition)
  }

  return block
}
