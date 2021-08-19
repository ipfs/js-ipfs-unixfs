import extractDataFromBlock from '../../../utils/extract-data-from-block.js'
import validateOffsetAndLength from '../../../utils/validate-offset-and-length.js'

/**
 * @typedef {import('../../../types').ExporterOptions} ExporterOptions
 * @typedef {import('../../../types').UnixfsV1Resolver} UnixfsV1Resolver
 */

/**
 * @type {UnixfsV1Resolver}
 */
const rawContent = (cid, node, unixfs, path, resolve, depth, blockstore) => {
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

export default rawContent
