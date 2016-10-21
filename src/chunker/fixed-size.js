'use strict'

const pullBlock = require('pull-block')

module.exports = (size) => {
  return pullBlock(size, { zeroPadding: false })
}
