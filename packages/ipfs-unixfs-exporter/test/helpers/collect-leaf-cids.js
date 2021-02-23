'use strict'

/**
 * @param {import('cids')} cid
 * @param {import('ipld')} ipld
 */
module.exports = function (cid, ipld) {
  /**
   * @param {import('cids')} cid
   */
  async function * traverse (cid) {
    const node = await ipld.get(cid)

    if (node instanceof Uint8Array || !node.Links.length) {
      yield {
        node,
        cid
      }

      return
    }

    node.Links.forEach(
      /**
       * @param {import('ipld-dag-pb').DAGLink} link
       */
      link => traverse(link.Hash)
    )
  }

  return traverse(cid)
}
