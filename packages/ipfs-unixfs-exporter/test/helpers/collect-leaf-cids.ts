import * as dagPb from '@ipld/dag-pb'
import type { Blockstore } from 'interface-blockstore'
import type { CID } from 'multiformats/cid'

export default function (cid: CID, blockstore: Blockstore): AsyncGenerator<{ node: Uint8Array | dagPb.PBNode, cid: CID }, void, undefined> {
  async function * traverse (cid: CID): AsyncGenerator<{ node: dagPb.PBNode, cid: CID }, void, unknown> {
    const block = await blockstore.get(cid)
    const node = dagPb.decode(block)

    if (node instanceof Uint8Array || (node.Links.length === 0)) {
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
