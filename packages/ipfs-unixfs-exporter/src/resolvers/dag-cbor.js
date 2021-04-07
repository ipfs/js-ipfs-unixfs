'use strict'

const CID = require('cids')
const errCode = require('err-code')

/**
 * @typedef {import('../types').Resolver} Resolver
 */

/**
 * @type {Resolver}
 */
const resolve = async (cid, name, path, toResolve, resolve, depth, ipld, options) => {
  const object = await ipld.get(cid, options)
  const block = await ipld.get(new CID(1, 'raw', cid.multihash))
  let subObject = object
  let subPath = path

  while (toResolve.length) {
    const prop = toResolve[0]

    if (prop in subObject) {
      // remove the bit of the path we have resolved
      toResolve.shift()
      subPath = `${subPath}/${prop}`

      if (CID.isCID(subObject[prop])) {
        return {
          entry: {
            type: 'object',
            name,
            path,
            cid,
            node: block,
            depth,
            size: block.length,
            content: async function * () {
              yield object
            }
          },
          next: {
            cid: subObject[prop],
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
      size: block.length,
      content: async function * () {
        yield object
      }
    }
  }
}

module.exports = resolve
