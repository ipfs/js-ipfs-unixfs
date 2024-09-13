import { CID } from 'multiformats/cid'
import { NoPropError } from '../errors.js'
import type { ResolveResult } from '../index.js'

export function resolveObjectPath (object: any, block: Uint8Array, cid: CID, name: string, path: string, toResolve: string[], depth: number): ResolveResult {
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
      throw new NoPropError(`No property named ${prop} found in node ${cid}`)
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
