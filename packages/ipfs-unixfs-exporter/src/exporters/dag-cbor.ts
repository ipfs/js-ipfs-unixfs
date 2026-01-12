import * as dagCbor from '@ipld/dag-cbor'
import toBuffer from 'it-to-buffer'
import type { ExporterOptions, ObjectNode, ReadableStorage } from '../index.ts'
import type { CID } from 'multiformats/cid'

export async function dagCborResolver (cid: CID, name: string, path: string, blockstore: ReadableStorage, options?: ExporterOptions): Promise<ObjectNode> {
  const block = await toBuffer(blockstore.get(cid, options))
  const object = dagCbor.decode<any>(block)

  return {
    type: 'object',
    cid,
    name,
    path,
    object,
    node: block
  }
}
