'use strict'

const errCode = require('err-code')

const chunkers = {
  fixed: require('../chunker/fixed-size'),
  rabin: require('../chunker/rabin')
}

module.exports = (type, source, options) => {
  const chunker = chunkers[type]

  if (!chunker) {
    throw errCode(new Error(`Unknkown chunker named ${type}`), 'ERR_UNKNOWN_CHUNKER')
  }

  return chunker(source, options)
}
