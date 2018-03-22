'use strict'

const CID = require('cids')
const pull = require('pull-stream')
const asyncValues = require('pull-async-values')
const asyncMap = require('pull-stream/throughs/async-map')
const map = require('pull-stream/throughs/map')
const UnixFS = require('ipfs-unixfs')
const waterfall = require('async/waterfall')

module.exports = (fileNode, dag, begin = 0, end) => {
  let streamPosition = 0

  return pull(
    asyncValues((cb) => {
      const meta = UnixFS.unmarshal(fileNode.data)

      if (meta.type !== 'file') {
        return cb(new Error(`Node ${fileNode} was not a file (was ${meta.type}), can only read files`))
      }

      const fileSize = meta.fileSize()

      if (!end || end > fileSize) {
        end = fileSize
      }

      if (begin < 0) {
        begin = fileSize + begin
      }

      if (end < 0) {
        end = fileSize + end
      }

      const links = fileNode.links

      if (!links || !links.length) {
        if (meta.data && meta.data.length) {
          // file was small enough to fit in one DAGNode so has no links
          return cb(null, [(done) => done(null, meta.data)])
        }

        return cb(new Error(`Path ${fileNode} had no links or data`))
      }

      const linkedDataSize = links.reduce((acc, curr) => acc + curr.size, 0)
      const overhead = (linkedDataSize - meta.fileSize()) / links.length

      // create an array of functions to fetch link data
      cb(null, links.map((link) => (done) => {
        // DAGNode Links report unixfs object data sizes $overhead bytes (typically 14)
        // larger than they actually are due to the protobuf wrapper
        const bytesInLinkedObjectData = link.size - overhead

        if (begin > (streamPosition + bytesInLinkedObjectData)) {
          // Start byte is after this block so skip it
          streamPosition += bytesInLinkedObjectData

          return done()
        }

        if (end < streamPosition) {
          // End byte was before this block so skip it
          streamPosition += bytesInLinkedObjectData

          return done()
        }

        // transform the multihash to a cid, the cid to a node and the node to some data
        waterfall([
          (next) => dag.get(new CID(link.multihash), next),
          (node, next) => next(null, node.value.data),
          (data, next) => next(null, UnixFS.unmarshal(data).data)
        ], done)
      }))
    }),
    asyncMap((loadLinkData, cb) => loadLinkData(cb)),
    pull.filter(Boolean),
    map((data) => {
      const block = extractDataFromBlock(data, streamPosition, begin, end)

      streamPosition += data.length

      return block
    })
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
