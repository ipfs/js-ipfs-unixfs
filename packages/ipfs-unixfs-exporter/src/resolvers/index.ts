import * as dagCbor from '@ipld/dag-cbor'
import * as dagJson from '@ipld/dag-json'
import * as dagPb from '@ipld/dag-pb'
import errCode from 'err-code'
import * as json from 'multiformats/codecs/json'
import * as raw from 'multiformats/codecs/raw'
import { identity } from 'multiformats/hashes/identity'
import dagCborResolver from './dag-cbor.js'
import dagJsonResolver from './dag-json.js'
import identifyResolver from './identity.js'
import jsonResolver from './json.js'
import rawResolver from './raw.js'
import dagPbResolver from './unixfs-v1/index.js'
import type { Resolve, Resolver } from '../index.js'

const resolvers: Record<number, Resolver> = {
  [dagPb.code]: dagPbResolver,
  [raw.code]: rawResolver,
  [dagCbor.code]: dagCborResolver,
  [dagJson.code]: dagJsonResolver,
  [identity.code]: identifyResolver,
  [json.code]: jsonResolver
}

const resolve: Resolve = async (cid, name, path, toResolve, depth, blockstore, options) => {
  const resolver = resolvers[cid.code]

  if (resolver == null) {
    throw errCode(new Error(`No resolver for code ${cid.code}`), 'ERR_NO_RESOLVER')
  }

  return resolver(cid, name, path, toResolve, resolve, depth, blockstore, options)
}

export default resolve
