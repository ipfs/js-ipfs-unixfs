import * as dagCbor from '@ipld/dag-cbor'
import errCode from 'err-code'
import { CID } from 'multiformats/cid'
import type { Resolver } from '../index.js'

const resolve: Resolver = async (cid, name, path, toResolve, resolve, depth, blockstore, options) => {
  const block = await blockstore.get(cid, options)
  const object = dagCbor.decode<any>(block)
  let subObject = object
  let subPath = path

  while (toResolve.length > 0) {
    const prop = toResolve[0]

    if (prop in subObject) {
      // remove the bit of the path we have resolved
      toResolve.shift()
      subPath = `${subPath}/${prop}`

      const subObjectCid = CID.asCID(subObject[prop])
      if (subObjectCid != null) {
        return {
          entry: {
            type: 'object',
            name,
            path,
            cid,
            node: block,
            depth,
            size: BigInt(block.length),
            content: async function * () {
              yield object
            }
          },
          next: {
            cid: subObjectCid,
            name: prop,
            path: subPath,
            toResolve
          }
        }
      }

      subObject = subObject[prop]
    } else {
      // cannot resolve further
      throw errCode(new Error(`No property named ${prop} found in cbor node ${cid}`), 'ERR_NO_PROP')
    }
  }

  return {
    entry: {
      type: 'object',
      name,
      path,
      cid,
      node: block,
      depth,
      size: BigInt(block.length),
      content: async function * () {
        yield object
      }
    }
  }
}

export default resolve
