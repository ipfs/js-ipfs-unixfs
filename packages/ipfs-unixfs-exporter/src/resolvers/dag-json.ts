import * as dagJson from '@ipld/dag-json'
import toBuffer from 'it-to-buffer'
import { resolveObjectPath } from '../utils/resolve-object-path.js'
import type { Resolver } from '../index.js'

const resolve: Resolver = async (cid, name, path, toResolve, resolve, depth, blockstore, options) => {
  const block = await toBuffer(blockstore.get(cid, options))
  const object = dagJson.decode<any>(block)

  return resolveObjectPath(object, block, cid, name, path, toResolve, depth)
}

export default resolve
