'use strict'

const block = require('pull-block')

exports = module.exports = function (size) {
  return block(size, {zeroPadding: false})
}
