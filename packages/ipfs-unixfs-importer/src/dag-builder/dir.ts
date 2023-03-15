import { UnixFS } from 'ipfs-unixfs'
import { persist } from '../utils/persist.js'
import { encode, prepare } from '@ipld/dag-pb'
import type { Directory, InProgressImportResult, Blockstore } from '../index.js'
import type { Version } from 'multiformats/cid'
import type { ProgressOptions } from 'progress-events'

export interface DirBuilderOptions extends ProgressOptions {
  cidVersion: Version
  signal?: AbortSignal
}

export const dirBuilder = async (dir: Directory, blockstore: Blockstore, options: DirBuilderOptions): Promise<InProgressImportResult> => {
  const unixfs = new UnixFS({
    type: 'directory',
    mtime: dir.mtime,
    mode: dir.mode
  })

  const buffer = encode(prepare({ Data: unixfs.marshal() }))
  const cid = await persist(buffer, blockstore, options)
  const path = dir.path

  return {
    cid,
    path,
    unixfs,
    size: BigInt(buffer.length),
    originalPath: dir.originalPath
  }
}
