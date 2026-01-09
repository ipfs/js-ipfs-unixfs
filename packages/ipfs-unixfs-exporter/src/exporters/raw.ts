import toBuffer from 'it-to-buffer'
import { rawContent } from './utils/raw-content.ts'
import type { ExporterOptions, RawNode, ReadableStorage } from '../index.js'
import type { CID } from 'multiformats'

export async function rawResolver (cid: CID, blockstore: ReadableStorage, options?: ExporterOptions): Promise<RawNode> {
  const block = await toBuffer(blockstore.get(cid, options))

  return {
    type: 'raw',
    cid,
    content: rawContent(block, 'unixfs:exporter:progress:raw'),
    size: BigInt(block.length),
    node: block
  }
}
