'use strict'

module.exports = {
  karma: {
    browserNoActivityTimeout: 500 * 1000
  },
  webpack: {
    node: {
      // needed by the cbor module
      stream: true,

      // needed by the core-util-is module
      Buffer: true
    }
  }
}
