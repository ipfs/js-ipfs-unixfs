import { CID } from 'multiformats/cid'
import * as dagPb from '@ipld/dag-pb'
import { sha256 } from 'multiformats/hashes/sha2'
import type { Blockstore } from 'interface-blockstore'
import type { BlockCodec } from 'multiformats/codecs/interface'
import type { MultihashHasher } from 'multiformats/hashes/interface'
import type { Version as CIDVersion } from 'multiformats/cid'

export interface PersistOptions {
  codec?: BlockCodec<any, any>
  hasher: MultihashHasher
  cidVersion: CIDVersion
  onlyHash: boolean
  signal?: AbortSignal
}

export const persist = async (buffer: Uint8Array, blockstore: Blockstore, options: PersistOptions): Promise<CID> => {
  if (options.codec == null) {
    options.codec = dagPb
  }

  if (options.hasher == null) {
    options.hasher = sha256
  }

  if (options.cidVersion === undefined) {
    options.cidVersion = 1
  }

  if (options.codec === dagPb && options.hasher !== sha256) {
    options.cidVersion = 1
  }

  const multihash = await options.hasher.digest(buffer)
  const cid = CID.create(options.cidVersion, options.codec.code, multihash)

  if (!options.onlyHash) {
    await blockstore.put(cid, buffer, {
      signal: options.signal
    })
  }

  return cid
}
