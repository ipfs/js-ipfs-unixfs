import * as dagCbor from '@ipld/dag-cbor'
import { resolveObjectPath } from '../utils/resolve-object-path.js'
import type { Resolver } from '../index.js'

const resolve: Resolver = async (cid, name, path, toResolve, resolve, depth, blockstore, options) => {
  const block = await blockstore.get(cid, options)
  const object = dagCbor.decode<any>(block)

  return resolveObjectPath(object, block, cid, name, path, toResolve, depth)
}

export default resolve
