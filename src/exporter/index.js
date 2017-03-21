'use strict'

const pull = require('pull-stream')
const CID = require('cids')
const isIPFS = require('is-ipfs')

const resolve = require('./resolve').resolve
const cleanMultihash = require('./clean-multihash')

module.exports = (hash, ipldResolver) => {
  if (!isIPFS.multihash(hash)) {
    return pull.error(new Error('not valid multihash'))
  }

  hash = cleanMultihash(hash)

  return pull(
    ipldResolver.getStream(new CID(hash)),
    pull.map((result) => result.value),
    pull.map((node) => resolve(node, hash, ipldResolver)),
    pull.flatten()
  )
}
