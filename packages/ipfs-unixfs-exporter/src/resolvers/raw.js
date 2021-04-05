'use strict'

const errCode = require('err-code')
const extractDataFromBlock = require('../utils/extract-data-from-block')
const validateOffsetAndLength = require('../utils/validate-offset-and-length')

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
const resolve = async (cid, name, path, toResolve, resolve, depth, blockService, options) => {
  if (toResolve.length) {
    throw errCode(new Error(`No link named ${path} found in raw node ${cid}`), 'ERR_NOT_FOUND')
  }

  const block = await blockService.get(cid, options)

  return {
    entry: {
      type: 'raw',
      name,
      path,
      cid,
      content: rawContent(block.bytes),
      depth,
      size: block.bytes.length,
      node: block.bytes
    }
  }
}

module.exports = resolve
