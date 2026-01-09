import * as dagJson from '@ipld/dag-json'
import toBuffer from 'it-to-buffer'
import type { ExporterOptions, ObjectNode, ReadableStorage } from '../index.ts'
import type { CID } from 'multiformats/cid'

export async function dagJsonResolver (cid: CID, blockstore: ReadableStorage, options?: ExporterOptions): Promise<ObjectNode> {
  const block = await toBuffer(blockstore.get(cid, options))
  const object = dagJson.decode<any>(block)

  return {
    type: 'object',
    cid,
    object,
    node: block
  }
}
