'use strict'

const errCode = require('err-code')
const extractDataFromBlock = require('../utils/extract-data-from-block')
const validateOffsetAndLength = require('../utils/validate-offset-and-length')
const mh = require('multihashing-async').multihash

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
const resolve = async (cid, name, path, toResolve, resolve, depth, ipld, options) => {
  if (toResolve.length) {
    throw errCode(new Error(`No link named ${path} found in raw node ${cid}`), 'ERR_NOT_FOUND')
  }

  const buf = await mh.decode(cid.multihash)

  return {
    entry: {
      type: 'identity',
      name,
      path,
      cid,
      content: rawContent(buf.digest),
      depth,
      size: buf.length,
      node: buf.digest
    }
  }
}

module.exports = resolve
