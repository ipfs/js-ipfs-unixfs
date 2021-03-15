'use strict'

const errCode = require('err-code')

/**
 * @typedef {import('cids')} CID
 * @typedef {import('ipld')} IPLD
 * @typedef {import('../types').ExporterOptions} ExporterOptions
 * @typedef {import('../types').UnixFSEntry} UnixFSEntry
 * @typedef {import('../types').Resolver} Resolver
 * @typedef {import('../types').Resolve} Resolve
 */

/**
 * @type {{ [ key: string ]: Resolver }}
 */
const resolvers = {
  'dag-pb': require('./unixfs-v1'),
  raw: require('./raw'),
  'dag-cbor': require('./dag-cbor'),
  identity: require('./identity')
}

/**
 * @type {Resolve}
 */
function resolve (cid, name, path, toResolve, depth, ipld, options) {
  const resolver = resolvers[cid.codec]

  if (!resolver) {
    throw errCode(new Error(`No resolver for codec ${cid.codec}`), 'ERR_NO_RESOLVER')
  }

  return resolver(cid, name, path, toResolve, resolve, depth, ipld, options)
}

module.exports = resolve
