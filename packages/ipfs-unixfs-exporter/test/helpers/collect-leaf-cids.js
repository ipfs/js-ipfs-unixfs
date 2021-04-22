'use strict'

const { decode } = require('@ipld/dag-pb')

/**
 * @typedef {import('@ipld/dag-pb').PBLink} PBLink
 */

/**
 * @param {import('multiformats/cid').CID} cid
 * @param {import('ipfs-unixfs-importer/src/types').BlockAPI} blockService
 */
module.exports = function (cid, blockService) {
  /**
   * @param {import('multiformats/cid').CID} cid
   */
  async function * traverse (cid) {
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
       * @param {PBLink} link
       */
      link => traverse(link.Hash)
    )
  }

  return traverse(cid)
}
