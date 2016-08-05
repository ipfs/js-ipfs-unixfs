'use strict'

const mh = require('multihashes')
const isIPFS = require('is-ipfs')

module.exports = function (multihash) {
  if (!isIPFS.multihash(multihash)) {
    throw new Error('not valid multihash')
  }
  if (Buffer.isBuffer(multihash)) {
    return mh.toB58String(multihash)
  }
  return multihash
}
