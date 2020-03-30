'use strict'

const errCode = require('err-code')

const resolvers = {
  'dag-pb': require('./unixfs-v1'),
  raw: require('./raw'),
  'dag-cbor': require('./dag-cbor'),
  identity: require('./identity')
}

const resolve = (cid, name, path, toResolve, depth, ipld, options) => {
  const resolver = resolvers[cid.codec]

  if (!resolver) {
    throw errCode(new Error(`No resolver for codec ${cid.codec}`), 'ERR_NO_RESOLVER')
  }

  return resolver(cid, name, path, toResolve, resolve, depth, ipld, options)
}

module.exports = resolve
