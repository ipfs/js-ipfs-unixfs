'use strict'

const UnixFS = require('ipfs-unixfs')
const pull = require('pull-stream')
const mh = require('multihashes')

exports.switchType = (node, dirHandler, fileHandler) => {
  const data = UnixFS.unmarshal(node.data)
  const type = data.type

  if (type === 'directory') {
    return dirHandler()
  }

  if (type === 'file') {
    return fileHandler()
  }

  return pull.error(new Error('Unkown node type'))
}

exports.cleanMultihash = (multihash) => {
  if (Buffer.isBuffer(multihash)) {
    return mh.toB58String(multihash)
  }

  return multihash
}
