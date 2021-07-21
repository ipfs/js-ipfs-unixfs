import errCode from 'err-code'

import * as dagPb from '@ipld/dag-pb'
import * as dagCbor from '@ipld/dag-cbor'
import * as raw from 'multiformats/codecs/raw'
import { identity } from 'multiformats/hashes/identity'

// TODO: Lazy Load
import unixFs1Resolver from './unixfs-v1/index.js'
import rawResolver from './raw.js'
import dagCborResolver from './dag-cbor.js'
import identityResolver from './identity.js'

/**
 * @typedef {import('../types').Resolver} Resolver
 * @typedef {import('../types').Resolve} Resolve
 */

/**
 * @type {{ [ key: string ]: Resolver }}
 */
const resolvers = {
  [dagPb.code]: unixFs1Resolver,
  [raw.code]: rawResolver,
  [dagCbor.code]: dagCborResolver,
  [identity.code]: identityResolver
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

export default resolve
