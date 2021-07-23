import errCode from 'err-code'

import * as dagPb from '@ipld/dag-pb'
import * as dagCbor from '@ipld/dag-cbor'
import * as raw from 'multiformats/codecs/raw'
import { identity } from 'multiformats/hashes/identity'

/**
 * @typedef {import('../types').Resolver} Resolver
 * @typedef {import('../types').Resolve} Resolve
 */

/**
 * @param {number} key
 * @returns {Promise<Resolver|undefined>}
 */
const importResolver = async (key) => {
  switch (key) {
    case dagPb.code:
      return (await (import('./unixfs-v1/index.js'))).default
    case raw.code:
      return (await (import('./raw.js'))).default
    case dagCbor.code:
      return (await (import('./dag-cbor.js'))).default
    case identity.code:
      return (await (import('./identity.js'))).default
    default:
  }
}

/**
 * @type {Resolve}
 */
async function resolve (cid, name, path, toResolve, depth, blockstore, options) {
  const resolver = await importResolver(cid.code)

  if (!resolver) {
    throw errCode(new Error(`No resolver for code ${cid.code}`), 'ERR_NO_RESOLVER')
  }

  return resolver(cid, name, path, toResolve, resolve, depth, blockstore, options)
}

export default resolve
