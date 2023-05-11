import { encode, prepare } from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import { persist } from '../utils/persist.js'
import type { Directory, InProgressImportResult, WritableStorage } from '../index.js'
import type { Version } from 'multiformats/cid'

export interface DirBuilderOptions {
  cidVersion: Version
  signal?: AbortSignal
}

export const dirBuilder = async (dir: Directory, blockstore: WritableStorage, options: DirBuilderOptions): Promise<InProgressImportResult> => {
  const unixfs = new UnixFS({
    type: 'directory',
    mtime: dir.mtime,
    mode: dir.mode
  })

  const block = encode(prepare({ Data: unixfs.marshal() }))
  const cid = await persist(block, blockstore, options)
  const path = dir.path

  return {
    cid,
    path,
    unixfs,
    size: BigInt(block.length),
    originalPath: dir.originalPath,
    block
  }
}
