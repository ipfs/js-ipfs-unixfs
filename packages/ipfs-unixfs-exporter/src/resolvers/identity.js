import errCode from 'err-code'
import extractDataFromBlock from '../utils/extract-data-from-block.js'
import validateOffsetAndLength from '../utils/validate-offset-and-length.js'
import * as mh from 'multiformats/hashes/digest'

/**
 * @typedef {import('../types').ExporterOptions} ExporterOptions
 * @typedef {import('../types').Resolver} Resolver
 */

/**
 * @param {Uint8Array} node
 */
const rawContent = (node) => {
  /**
   * @param {ExporterOptions} options
   */
  async function * contentGenerator (options = {}) {
    const {
      offset,
      length
    } = validateOffsetAndLength(node.length, options.offset, options.length)

    yield extractDataFromBlock(node, 0, offset, offset + length)
  }

  return contentGenerator
}

/**
 * @type {Resolver}
 */
const resolve = async (cid, name, path, toResolve, resolve, depth, blockstore, options) => {
  if (toResolve.length) {
    throw errCode(new Error(`No link named ${path} found in raw node ${cid}`), 'ERR_NOT_FOUND')
  }
  const buf = await mh.decode(cid.multihash.bytes)

  return {
    entry: {
      type: 'identity',
      name,
      path,
      cid,
      content: rawContent(buf.digest),
      depth,
      size: buf.digest.length,
      node: buf.digest
    }
  }
}

export default resolve
