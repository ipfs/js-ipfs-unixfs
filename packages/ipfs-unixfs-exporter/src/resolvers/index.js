'use strict'

const errCode = require('err-code')

const dagPb = require('@ipld/dag-pb')
const dagCbor = require('@ipld/dag-cbor')
const raw = require('multiformats/codecs/raw')
const { identity } = require('multiformats/hashes/identity')

/**
 * @typedef {import('../types').Resolver} Resolver
 * @typedef {import('../types').Resolve} Resolve
 */

/**
 * @type {{ [ key: string ]: Resolver }}
 */
const resolvers = {
  [dagPb.code]: require('./unixfs-v1'),
  [raw.code]: require('./raw'),
  [dagCbor.code]: require('./dag-cbor'),
  [identity.code]: require('./identity')
}

/**
 * @type {Resolve}
 */
function resolve (cid, name, path, toResolve, depth, blockstore, options) {
  const resolver = resolvers[cid.code]

  if (!resolver) {
    throw errCode(new Error(`No resolver for code ${cid.code}`), 'ERR_NO_RESOLVER')
  }

  return resolver(cid, name, path, toResolve, resolve, depth, blockstore, options)
}

module.exports = resolve
