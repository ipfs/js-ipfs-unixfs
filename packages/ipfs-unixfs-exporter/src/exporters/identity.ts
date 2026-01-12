import * as mh from 'multiformats/hashes/digest'
import { rawContent } from './utils/raw-content.ts'
import type { ExporterOptions, IdentityNode, ReadableStorage } from '../index.js'
import type { CID } from 'multiformats'

export async function identityResolver (cid: CID, name: string, path: string, blockstore: ReadableStorage, options?: ExporterOptions): Promise<IdentityNode> {
  const block = mh.decode(cid.multihash.bytes)

  return {
    type: 'identity',
    cid,
    name,
    path,
    content: rawContent(block.digest, 'unixfs:exporter:progress:identity'),
    size: BigInt(block.bytes.length),
    node: block.bytes
  }
}
