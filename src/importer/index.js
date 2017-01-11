'use strict'

const assert = require('assert')
const createAndStoreTree = require('./flush-tree')
const Builder = require('../builder')

const chunkers = {
  fixed: require('../chunker/fixed-size')
}

const defaultOptions = {
  chunker: 'fixed'
}

module.exports = function (ipldResolver, _options) {
  const options = Object.assign({}, defaultOptions, _options)
  const Chunker = chunkers[options.chunker]
  assert(Chunker, 'Unknkown chunker named ' + options.chunker)
  return Builder(Chunker, ipldResolver, createAndStoreTree, options)
}
