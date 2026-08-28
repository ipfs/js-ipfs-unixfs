import { encode, prepare } from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import { persist } from '../utils/persist.ts'
import type { Directory, InProgressImportResult, WritableStorage } from '../index.ts'
import type { FieldOrder } from '@ipld/dag-pb'
import type { Version } from 'multiformats/cid'

export interface DirBuilderOptions {
  cidVersion: Version
  signal?: AbortSignal
  fieldOrder?: FieldOrder
}

export interface DirBuilder {
  (dir: Directory, blockstore: WritableStorage, options: DirBuilderOptions): Promise<InProgressImportResult>
}

export const defaultDirBuilder: DirBuilder = async (dir: Directory, blockstore: WritableStorage, options: DirBuilderOptions): Promise<InProgressImportResult> => {
  const unixfs = new UnixFS({
    type: 'directory',
    mtime: dir.mtime,
    mode: dir.mode
  })

  const block = encode(prepare({ Data: unixfs.marshal() }), options)
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
