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
const resolve = async (cid, name, path, toResolve, resolve, depth, ipld, options) => {
  if (toResolve.length) {
    throw errCode(new Error(`No link named ${path} found in raw node ${cid}`), 'ERR_NOT_FOUND')
  }

  const buf = await ipld.get(cid, options)

  return {
    entry: {
      type: 'raw',
      name,
      path,
      cid,
      content: rawContent(buf),
      depth,
      size: buf.length,
      node: buf
    }
  }
}

module.exports = resolve
