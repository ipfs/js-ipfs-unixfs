'use strict'

const CID = require('cids')

module.exports = (multihash) => {
  return new CID(multihash).toBaseEncodedString()
}
