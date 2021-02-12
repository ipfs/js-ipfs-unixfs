'use strict'

const errCode = require('err-code')
const extractDataFromBlock = require('../utils/extract-data-from-block')
const validateOffsetAndLength = require('../utils/validate-offset-and-length')
const mh = require('multihashing-async').multihash
const UnixFS = require('ipfs-unixfs')
const {
  DAGNode
} = require('ipld-dag-pb')

/**
 * @typedef {import('../').ExporterOptions} ExporterOptions
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
 * @type {import('./').Resolver}
 */
const resolve = async (cid, name, path, toResolve, resolve, depth, ipld, options) => {
  if (toResolve.length) {
    throw errCode(new Error(`No link named ${path} found in raw node ${cid.toBaseEncodedString()}`), 'ERR_NOT_FOUND')
  }

  const buf = await mh.decode(cid.multihash)

  return {
    entry: {
      type: 'file',
      name,
      path,
      cid,
      content: rawContent(buf.digest),
      depth,
      unixfs: new UnixFS({ type: 'file', data: buf.digest }),
      node: new DAGNode(buf.digest)
    }
  }
}

module.exports = resolve
