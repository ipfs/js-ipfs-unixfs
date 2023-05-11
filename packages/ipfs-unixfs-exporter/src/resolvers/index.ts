
import * as dagCbor from '@ipld/dag-cbor'
import * as dagPb from '@ipld/dag-pb'
import errCode from 'err-code'
import * as raw from 'multiformats/codecs/raw'
import { identity } from 'multiformats/hashes/identity'
import dagCborResolver from './dag-cbor.js'
import identifyResolver from './identity.js'
import rawResolver from './raw.js'
import dagPbResolver from './unixfs-v1/index.js'
import type { Resolve, Resolver } from '../index.js'

const resolvers: Record<number, Resolver> = {
  [dagPb.code]: dagPbResolver,
  [raw.code]: rawResolver,
  [dagCbor.code]: dagCborResolver,
  [identity.code]: identifyResolver
}

const resolve: Resolve = async (cid, name, path, toResolve, depth, blockstore, options) => {
  const resolver = resolvers[cid.code]

  if (resolver == null) {
    throw errCode(new Error(`No resolver for code ${cid.code}`), 'ERR_NO_RESOLVER')
  }

  return resolver(cid, name, path, toResolve, resolve, depth, blockstore, options)
}

export default resolve
