import * as dagPb from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import toBuffer from 'it-to-buffer'
import type { Blockstore } from 'interface-blockstore'
import type { CID } from 'multiformats/cid'

export async function printDag (cid: CID, blockstore: Blockstore, name?: string, prefix?: string): Promise<void> {
  const block = await toBuffer(blockstore.get(cid))
  const node = dagPb.decode(block)
  let type = ''
  let unix: UnixFS | undefined

  if (node.Data != null) {
    unix = UnixFS.unmarshal(node.Data)
    type = unix.type
  }

  const args = [type]

  if (prefix != null) {
    args.unshift(prefix)
  }

  if (name != null) {
    args.push(name)
  }

  args.push(cid.toString())

  // eslint-disable-next-line no-console
  console.info(...args)

  if (unix?.isDirectory()) {
    for (const link of node.Links) {
      await printDag(link.Hash, blockstore, link.Name, `${prefix ?? ''}  `)
    }
  }
}
