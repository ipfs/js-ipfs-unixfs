'use strict'

const mh = require('multihashes')

module.exports = (multihash) => {
  if (Buffer.isBuffer(multihash)) {
    return mh.toB58String(multihash)
  }

  return multihash
}
