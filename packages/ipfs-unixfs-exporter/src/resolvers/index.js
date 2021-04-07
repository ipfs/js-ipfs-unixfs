'use strict'

const errCode = require('err-code')
const multicodec = require('multicodec')

/**
 * @typedef {import('../').BlockAPI} BlockAPI
 * @typedef {import('../types').ExporterOptions} ExporterOptions
 * @typedef {import('../types').UnixFSEntry} UnixFSEntry
 * @typedef {import('../types').Resolver} Resolver
 * @typedef {import('../types').Resolve} Resolve
 */

/**
 * @type {{ [ key: string ]: Resolver }}
 */
const resolvers = {
  [multicodec.DAG_PB]: require('./unixfs-v1'),
  [multicodec.RAW]: require('./raw'),
  [multicodec.DAG_CBOR]: require('./dag-cbor'),
  [multicodec.IDENTITY]: require('./identity')
}

/**
 * @type {Resolve}
 */
function resolve (cid, name, path, toResolve, depth, blockService, options) {
  const resolver = resolvers[cid.code]

  if (!resolver) {
    // @ts-ignore - A `CodecCode` is expected, but a number is just fine
    throw errCode(new Error(`No resolver for codec ${multicodec.getName(cid.code)}`), 'ERR_NO_RESOLVER')
  }

  return resolver(cid, name, path, toResolve, resolve, depth, blockService, options)
}

module.exports = resolve
