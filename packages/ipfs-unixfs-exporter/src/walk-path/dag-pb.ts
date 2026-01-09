import * as dagPb from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import toBuffer from 'it-to-buffer'
import { CID } from 'multiformats/cid'
import { NotFoundError, NotUnixFSError } from '../errors.ts'
import { findShardCid } from './utils/find-cid-in-shard.ts'
import type { WalkPathOptions, ReadableStorage } from '../index.ts'
import type { ResolveResult } from './index.ts'

export async function * dagPbResolver (root: CID, path: string[], blockstore: ReadableStorage, options?: WalkPathOptions): AsyncGenerator<ResolveResult> {
  const block = await toBuffer(blockstore.get(root, options))
  let pbNode: dagPb.PBNode

  try {
    pbNode = dagPb.decode(block)
  } catch (err: any) {
    throw new NotUnixFSError(err.message)
  }

  if (pbNode.Data == null) {
    throw new NotUnixFSError('no data in PBNode')
  }

  let unixfs: UnixFS

  try {
    unixfs = UnixFS.unmarshal(pbNode.Data)
  } catch (err: any) {
    // non-UnixFS dag-pb node? It could happen.
    throw new NotUnixFSError(err.message)
  }

  if (unixfs.type === 'directory' || (unixfs.type === 'hamt-sharded-directory' && options?.translateHamtPath === false)) {
    const link = pbNode.Links.find(link => link.Name === path[0])

    if (link == null) {
      throw new NotFoundError(`No link "${path[0]}" found under ${root}`)
    }

    yield {
      cid: link.Hash,
      name: path[0],
      rest: path.slice(1)
    }
  } else if (unixfs.type === 'hamt-sharded-directory') {
    let foundPath = false

    for await (const entry of findShardCid(pbNode, path[0], path.slice(1), blockstore, undefined, options)) {
      if (entry.name === path[0]) {
        foundPath = true
      }

      yield entry
    }

    if (!foundPath) {
      throw new NotFoundError(`No link "${path[0]}" found under ${root}`)
    }
  }
}
