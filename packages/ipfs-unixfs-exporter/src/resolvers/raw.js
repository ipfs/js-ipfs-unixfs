import errCode from 'err-code'
import extractDataFromBlock from '../utils/extract-data-from-block.js'
import validateOffsetAndLength from '../utils/validate-offset-and-length.js'

/**
 * @typedef {import('../types').ExporterOptions} ExporterOptions
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
 * @type {import('../types').Resolver}
 */
const resolve = async (cid, name, path, toResolve, resolve, depth, blockstore, options) => {
  if (toResolve.length) {
    throw errCode(new Error(`No link named ${path} found in raw node ${cid}`), 'ERR_NOT_FOUND')
  }

  const block = await blockstore.get(cid, options)

  return {
    entry: {
      type: 'raw',
      name,
      path,
      cid,
      content: rawContent(block),
      depth,
      size: block.length,
      node: block
    }
  }
}

export default resolve
