'use strict'

const UnixFS = require('ipfs-unixfs')
const pull = require('pull-stream')

const resolvers = {
  directory: require('./dir-flat'),
  'hamt-sharded-directory': require('./dir-hamt-sharded'),
  file: require('./file')
}

module.exports = Object.assign({
  resolve: resolve,
  typeOf: typeOf
}, resolvers)

function resolve (node, name, ipldResolver, parentNode) {
  const type = typeOf(node)
  const resolver = resolvers[type]
  if (!resolver) {
    return pull.error(new Error('Unkown node type ' + type))
  }
  let stream = resolver(node, name, ipldResolver, resolve, parentNode)
  return stream
}

function typeOf (node) {
  const data = UnixFS.unmarshal(node.data)
  return data.type
}
