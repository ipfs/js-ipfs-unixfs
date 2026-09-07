import { encode, prepare } from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { persist } from '../utils/persist.ts'
import type { InProgressImportResult, Symlink, WritableStorage } from '../index.ts'
import type { Version } from 'multiformats/cid'

export interface SymlinkBuilderOptions {
  cidVersion: Version
  signal?: AbortSignal
}

export interface SymlinkBuilder {
  (symlink: Symlink, blockstore: WritableStorage, options: SymlinkBuilderOptions): Promise<InProgressImportResult>
}

export const defaultSymlinkBuilder: SymlinkBuilder = async (symlink: Symlink, blockstore: WritableStorage, options: SymlinkBuilderOptions): Promise<InProgressImportResult> => {
  const unixfs = new UnixFS({
    type: 'symlink',
    data: uint8ArrayFromString(symlink.link),
    mtime: symlink.mtime,
    mode: symlink.mode
  })

  const block = encode(prepare({ Data: unixfs.marshal() }))
  const cid = await persist(block, blockstore, options)
  const path = symlink.path

  return {
    cid,
    path,
    unixfs,
    size: BigInt(block.length),
    originalPath: symlink.originalPath,
    block
  }
}
