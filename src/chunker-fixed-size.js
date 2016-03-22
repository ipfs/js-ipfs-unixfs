'use strict'

const chunker = require('block-stream2')

exports = module.exports = function (size) {
  return chunker({ size: size, zeroPadding: false })
}
