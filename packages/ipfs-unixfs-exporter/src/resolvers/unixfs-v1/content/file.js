'use strict'

const extractDataFromBlock = require('../../../utils/extract-data-from-block')
const validateOffsetAndLength = require('../../../utils/validate-offset-and-length')
const UnixFS = require('ipfs-unixfs')
const errCode = require('err-code')

async function * emitBytes (ipld, node, start, end, streamPosition = 0) {
  // a `raw` node
  if (Buffer.isBuffer(node)) {
    const buf = extractDataFromBlock(node, streamPosition, start, end)

    if (buf.length) {
      yield buf
    }

    streamPosition += buf.length

    return streamPosition
  }

  let file

  try {
    file = UnixFS.unmarshal(node.Data)
  } catch (err) {
    throw errCode(err, 'ERR_NOT_UNIXFS')
  }

  // might be a unixfs `raw` node or have data on intermediate nodes
  const nodeHasData = Boolean(file.data && file.data.length)

  if (nodeHasData) {
    const buf = extractDataFromBlock(file.data, streamPosition, start, end)

    if (buf.length) {
      yield buf
    }

    streamPosition += file.data.length
  }

  let childStart = streamPosition

  // work out which child nodes contain the requested data
  for (let i = 0; i < node.Links.length; i++) {
    const childLink = node.Links[i]
    const childEnd = streamPosition + file.blockSizes[i]

    if ((start >= childStart && start < childEnd) || // child has offset byte
        (end > childStart && end <= childEnd) || // child has end byte
        (start < childStart && end > childEnd)) { // child is between offset and end bytes
      const child = await ipld.get(childLink.Hash)

      for await (const buf of emitBytes(ipld, child, start, end, streamPosition)) {
        streamPosition += buf.length

        yield buf
      }
    }

    streamPosition = childEnd
    childStart = childEnd + 1
  }
}

const fileContent = (cid, node, unixfs, path, resolve, depth, ipld) => {
  return (options = {}) => {
    const fileSize = unixfs.fileSize()

    const {
      offset,
      length
    } = validateOffsetAndLength(fileSize, options.offset, options.length)

    const start = offset
    const end = offset + length

    return emitBytes(ipld, node, start, end)
  }
}

module.exports = fileContent
