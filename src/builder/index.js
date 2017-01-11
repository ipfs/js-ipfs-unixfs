'use strict'

const assert = require('assert')
const createBuildStream = require('./create-build-stream')
const Builder = require('./builder')

const reducers = {
  flat: require('./flat'),
  balanced: require('./balanced'),
  trickle: require('./trickle')
}

const defaultOptions = {
  strategy: 'balanced',
  highWaterMark: 100,
  reduceSingleLeafToSelf: false
}

module.exports = function (Chunker, ipldResolver, flushTree, _options) {
  assert(Chunker, 'Missing chunker creator function')
  assert(ipldResolver, 'Missing IPLD Resolver')
  assert(flushTree, 'Missing flushTree argument')

  const options = Object.assign({}, defaultOptions, _options)

  const strategyName = options.strategy
  const reducer = reducers[strategyName]
  assert(reducer, 'Unknown importer build strategy name: ' + strategyName)

  const createStrategy = Builder(Chunker, ipldResolver, reducer, options)

  return createBuildStream(createStrategy, ipldResolver, flushTree, options)
}
