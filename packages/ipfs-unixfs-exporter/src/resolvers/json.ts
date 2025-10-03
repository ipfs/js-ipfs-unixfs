import toBuffer from 'it-to-buffer'
import * as json from 'multiformats/codecs/json'
import { resolveObjectPath } from '../utils/resolve-object-path.js'
import type { Resolver } from '../index.js'

const resolve: Resolver = async (cid, name, path, toResolve, resolve, depth, blockstore, options) => {
  const block = await toBuffer(blockstore.get(cid, options))
  const object = json.decode<any>(block)

  return resolveObjectPath(object, block, cid, name, path, toResolve, depth)
}

export default resolve
