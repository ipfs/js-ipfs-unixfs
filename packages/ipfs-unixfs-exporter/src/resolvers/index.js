'use strict'

const errCode = require('err-code')

/**
 * @typedef {import('ipfs-core-types/src/ipld').IPLD} IPLD
 * @typedef {import('../').ExporterOptions} ExporterOptions
 * @typedef {import('../').UnixFSEntry} UnixFSEntry
 * @typedef {import('cids')} CID
 */

/**
 * @typedef {object} NextResult
 * @property {CID} cid
 * @property {string} name
 * @property {string} path
 * @property {string[]} toResolve
 *
 * @typedef {object} ResolveResult
 * @property {UnixFSEntry} entry
 * @property {NextResult} [next]
 */

/**
 *
 * @typedef {(cid: CID, name: string, path: string, toResolve: string[], depth: number, ipld: IPLD, options: ExporterOptions) => Promise<ResolveResult>} Resolve
 *
 * @typedef {(cid: CID, name: string, path: string, toResolve: string[], resolve: Resolve, depth: number, ipld: IPLD, options: ExporterOptions) => Promise<ResolveResult>} Resolver
 *
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
