import { UnixFS, Node } from 'ipfs-unixfs'
import toBuffer from 'it-to-buffer'
import { CID } from 'multiformats'
import { CustomProgressEvent } from 'progress-events'
import { NotUnixFSError } from '../../../errors.ts'
import type { ReadableStorage, ExportWalk, UnixFSDirectoryEntry, ExportContentOptions } from '../../../index.ts'
import type { PBNode } from '@ipld/dag-pb'

async function * listDirectory (cid: CID, path: string, blockstore: ReadableStorage, options: ExportContentOptions): AsyncGenerator<UnixFSDirectoryEntry> {
  let index = -1
  let yielded = 0

  for await (const entry of list(cid, path, blockstore, options)) {
    index++

    if (options.offset != null && options.offset < index) {
      continue
    }

    yield entry
    yielded++

    if (options.length != null && options.length === yielded) {
      return
    }
  }
}

async function * list (cid: CID, path: string, blockstore: ReadableStorage, options: ExportContentOptions): AsyncGenerator<UnixFSDirectoryEntry> {
  const block = await toBuffer(blockstore.get(cid, options))
  const node = Node.decode(block)

  if (node.data?.fanOut == null) {
    throw new NotUnixFSError('missing fanout')
  }

  const prefixLength = (node.data.fanOut - 1n).toString(16).length

  for (const link of node.links) {
    if (link.name == null || link.hash == null) {
      continue
    }

    const cid = CID.decode(link.hash)

    if (link.name.length === prefixLength) {
      yield * list(cid, path, blockstore, options)
    } else {
      const name = link.name.substring(prefixLength)

      yield {
        cid,
        name: link.name.substring(prefixLength),
        path: `${path}/${name}`,
        size: BigInt(link.tSize ?? 0)
      }
    }
  }
}

export function hamtShardedDirectoryContent (cid: CID, node: PBNode, unixfs: UnixFS, path: string, blockstore: ReadableStorage): (options: ExportContentOptions) => AsyncGenerator<UnixFSDirectoryEntry> {
  function yieldHamtDirectoryContent (options: ExportContentOptions = {}): AsyncGenerator<UnixFSDirectoryEntry> {
    options.onProgress?.(new CustomProgressEvent<ExportWalk>('unixfs:exporter:walk:hamt-sharded-directory', {
      cid
    }))

    return listDirectory(cid, path, blockstore, options)
  }

  return yieldHamtDirectoryContent
}
