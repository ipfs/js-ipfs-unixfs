import { decode } from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import toBuffer from 'it-to-buffer'
import { NotFoundError, NotUnixFSError } from '../../errors.js'
import { directoryContent } from './content/directory.js'
import { fileContent } from './content/file.js'
import { hamtShardedDirectoryContent } from './content/hamt-sharded-directory.js'
import type { ExporterOptions, ReadableStorage, UnixFSEntry } from '../../index.js'
import type { PBNode } from '@ipld/dag-pb'
import type { CID } from 'multiformats/cid'

interface UnixfsV1Resolver {
  (cid: CID, node: PBNode, unixfs: UnixFS, blockstore: ReadableStorage): (options: ExporterOptions) => any
}

const contentExporters: Record<string, UnixfsV1Resolver> = {
  raw: fileContent,
  file: fileContent,
  directory: directoryContent,
  'hamt-sharded-directory': hamtShardedDirectoryContent,
  metadata: (cid, node, unixfs, blockstore) => {
    return () => []
  },
  symlink: (cid, node, unixfs, blockstore) => {
    return () => []
  }
}

export async function dagPbResolver (cid: CID, blockstore: ReadableStorage, options?: ExporterOptions): Promise<UnixFSEntry> {
  const block = await toBuffer(blockstore.get(cid, options))
  let node: PBNode

  try {
    node = decode(block)
  } catch (err: any) {
    // badly formatted or invalid protobuf
    throw new NotUnixFSError(err.message)
  }

  if (node.Data == null) {
    throw new NotUnixFSError('no data in PBNode')
  }

  let unixfs: UnixFS

  try {
    unixfs = UnixFS.unmarshal(node.Data)
  } catch (err: any) {
    // non-UnixFS dag-pb node? It could happen.
    throw new NotUnixFSError(err.message)
  }

  const content = contentExporters[unixfs.type](cid, node, unixfs, blockstore)

  if (content == null) {
    throw new NotFoundError('could not find content exporter')
  }

  if (unixfs.isDirectory()) {
    return {
      type: 'directory',
      cid,
      entries: content,
      unixfs,
      node
    }
  }

  return {
    type: 'file',
    cid,
    content,
    unixfs,
    node,
    size: unixfs.fileSize()
  }
}
