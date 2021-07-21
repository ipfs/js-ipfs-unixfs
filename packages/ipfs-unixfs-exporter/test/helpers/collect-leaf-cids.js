import * as dagPb from '@ipld/dag-pb'

/**
 * @typedef {import('@ipld/dag-pb').PBLink} PBLink
 */

/**
 * @param {import('multiformats/cid').CID} cid
 * @param {import('interface-blockstore').Blockstore} blockstore
 */
export default function (cid, blockstore) {
  /**
   * @param {import('multiformats/cid').CID} cid
   */
  async function * traverse (cid) {
    const block = await blockstore.get(cid)
    const node = dagPb.decode(block)

    if (node instanceof Uint8Array || !node.Links.length) {
      yield {
        node,
        cid
      }

      return
    }

    node.Links.forEach(link => traverse(link.Hash))
  }

  return traverse(cid)
}
