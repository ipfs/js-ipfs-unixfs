'use strict'

const UnixFS = require('ipfs-unixfs')
const pull = require('pull-stream')

const resolvers = {
  directory: require('./dir-flat'),
  'hamt-sharded-directory': require('./dir-hamt-sharded'),
  file: require('./file'),
  object: require('./object')
}

module.exports = Object.assign({
  resolve: resolve,
  typeOf: typeOf
}, resolvers)

function resolve (node, hash, pathRest, ipldResolver, parentNode) {
  const type = typeOf(node)
  const resolver = resolvers[type]
  if (!resolver) {
    return pull.error(new Error('Unkown node type ' + type))
  }
  return resolver(node, hash, pathRest, ipldResolver, resolve, parentNode)
}

function typeOf (node) {
  if (Buffer.isBuffer(node.data)) {
    return UnixFS.unmarshal(node.data).type
  } else {
    return 'object'
  }
}
