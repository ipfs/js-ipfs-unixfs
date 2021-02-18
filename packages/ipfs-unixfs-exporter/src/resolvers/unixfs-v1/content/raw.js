'use strict'

const extractDataFromBlock = require('../../../utils/extract-data-from-block')
const validateOffsetAndLength = require('../../../utils/validate-offset-and-length')

/**
 * @typedef {import('../../../').ExporterOptions} ExporterOptions
 *
 * @type {import('../').UnixfsV1Resolver}
 */
const rawContent = (cid, node, unixfs, path, resolve, depth, ipld) => {
  /**
   * @param {ExporterOptions} options
   */
  function * yieldRawContent (options = {}) {
    if (!unixfs.data) {
      throw new Error('Raw block had no data')
    }

    const size = unixfs.data.length

    const {
      offset,
      length
    } = validateOffsetAndLength(size, options.offset, options.length)

    yield extractDataFromBlock(unixfs.data, 0, offset, offset + length)
  }

  return yieldRawContent
}

module.exports = rawContent
