'use strict'

// @ts-ignore - TODO vmx 2021-03-25: add typedefs
const { decode } = require('@ipld/dag-pb')

/**
 * @typedef {import('../../src/types').PbLink} PbLink
 */

/**
 * @param {import('multiformats/cid')} cid
 * @param {import('ipfs-unixfs-importer/src/types').BlockAPI} blockService
 */
module.exports = function (cid, blockService) {
  /**
   * @param {import('multiformats/cid')} cid
   */
  async function * traverse (cid) {
    // @ts-ignore - TODO vmx 2021-03-25: the multiformats package is the problem, not the code
    const block = await blockService.get(cid)
    const node = decode(block.bytes)

    if (node instanceof Uint8Array || !node.Links.length) {
      yield {
        node,
        cid
      }

      return
    }

    node.Links.forEach(
      /**
       * @param {PbLink} link
       */
      // @ts-ignore - TODO vmx 2021-03-25: the multiformats package is the problem, not the code
      link => traverse(link.Hash)
    )
  }

  return traverse(cid)
}
