import * as dagCbor from '@ipld/dag-cbor'
import * as dagJson from '@ipld/dag-json'
import * as dagPb from '@ipld/dag-pb'
import * as json from 'multiformats/codecs/json'
import * as raw from 'multiformats/codecs/raw'
import { identity } from 'multiformats/hashes/identity'
import { CODEC_CBOR } from '../constants.ts'
import { NoResolverError } from '../errors.js'
import { dagCborResolver } from './dag-cbor.js'
import { dagJsonResolver } from './dag-json.js'
import { identityResolver } from './identity.js'
import { jsonResolver } from './json.js'
import { rawResolver } from './raw.js'
import { dagPbResolver } from './unixfs-v1/index.js'
import type { Resolver } from '../index.js'

const resolvers: Record<number, Resolver> = {
  [dagPb.code]: dagPbResolver,
  [raw.code]: rawResolver,
  [dagCbor.code]: dagCborResolver,
  [CODEC_CBOR]: dagCborResolver,
  [dagJson.code]: dagJsonResolver,
  [identity.code]: identityResolver,
  [json.code]: jsonResolver
}

export const resolve: Resolver = async (cid, blockstore, options) => {
  const resolver = resolvers[cid.code]

  if (resolver == null) {
    throw new NoResolverError(`No resolver for code ${cid.code}`)
  }

  return resolver(cid, blockstore, options)
}
