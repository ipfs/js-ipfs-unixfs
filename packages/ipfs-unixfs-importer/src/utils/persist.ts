import * as dagPb from '@ipld/dag-pb'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import { DEFAULT_CID_VERSION } from '../constants.ts'
import type { WritableStorage } from '../index.ts'
import type { FieldOrder } from '@ipld/dag-pb'
import type { Version as CIDVersion } from 'multiformats/cid'
import type { BlockCodec } from 'multiformats/codecs/interface'
import type { ProgressOptions } from 'progress-events'

export interface PersistOptions extends ProgressOptions {
  codec?: BlockCodec<any, any>
  cidVersion?: CIDVersion
  signal?: AbortSignal
  fieldOrder?: FieldOrder
}

export const persist = async (buffer: Uint8Array, blockstore: WritableStorage, options: PersistOptions): Promise<CID> => {
  if (options.codec == null) {
    options.codec = dagPb
  }

  const multihash = await sha256.digest(buffer)
  const cid = CID.create(options.cidVersion ?? DEFAULT_CID_VERSION, options.codec.code, multihash)

  await blockstore.put(cid, buffer, options)

  return cid
}
