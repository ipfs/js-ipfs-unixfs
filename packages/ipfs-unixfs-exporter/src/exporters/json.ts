import toBuffer from 'it-to-buffer'
import * as json from 'multiformats/codecs/json'
import type { ExporterOptions, ObjectNode, ReadableStorage } from '../index.ts'
import type { CID } from 'multiformats/cid'

export async function jsonResolver (cid: CID, blockstore: ReadableStorage, options?: ExporterOptions): Promise<ObjectNode> {
  const block = await toBuffer(blockstore.get(cid, options))
  const object = json.decode<any>(block)

  return {
    type: 'object',
    cid,
    object,
    node: block
  }
}
