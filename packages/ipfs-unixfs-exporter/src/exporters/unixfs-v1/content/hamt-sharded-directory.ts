import { decode } from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import map from 'it-map'
import parallel from 'it-parallel'
import { pipe } from 'it-pipe'
import toBuffer from 'it-to-buffer'
import { CustomProgressEvent } from 'progress-events'
import { NotUnixFSError } from '../../../errors.js'
import type { ReadableStorage, ExportWalk, UnixFSDirectoryEntry, ExportContentOptions } from '../../../index.js'
import type { PBNode } from '@ipld/dag-pb'
import type { CID } from 'multiformats'

async function * listDirectory (node: PBNode, path: string, blockstore: ReadableStorage, options: ExportContentOptions): AsyncGenerator<UnixFSDirectoryEntry> {
  const links = node.Links

  if (node.Data == null) {
    throw new NotUnixFSError('no data in PBNode')
  }

  let dir: UnixFS
  try {
    dir = UnixFS.unmarshal(node.Data)
  } catch (err: any) {
    throw new NotUnixFSError(err.message)
  }

  if (dir.fanout == null) {
    throw new NotUnixFSError('missing fanout')
  }

  const padLength = (dir.fanout - 1n).toString(16).length

  const results = pipe(
    links,
    source => map(source, link => {
      return async () => {
        const name = link.Name != null ? link.Name.substring(padLength) : null

        if (name != null && name !== '') {
          return {
            entries: [{
              cid: link.Hash,
              name,
              path: `${path}/${name}`
            }]
          }
        } else {
          // descend into subshard
          const block = await toBuffer(blockstore.get(link.Hash, options))
          node = decode(block)

          options.onProgress?.(new CustomProgressEvent<ExportWalk>('unixfs:exporter:walk:hamt-sharded-directory', {
            cid: link.Hash
          }))

          return {
            entries: listDirectory(node, path, blockstore, options)
          }
        }
      }
    }),
    source => parallel(source, {
      ordered: true,
      concurrency: options.blockReadConcurrency
    })
  )

  for await (const { entries } of results) {
    yield * entries
  }
}

export function hamtShardedDirectoryContent (cid: CID, node: PBNode, unixfs: UnixFS, path: string, blockstore: ReadableStorage): (options: ExportContentOptions) => AsyncGenerator<UnixFSDirectoryEntry> {
  function yieldHamtDirectoryContent (options: ExportContentOptions = {}): AsyncGenerator<UnixFSDirectoryEntry> {
    options.onProgress?.(new CustomProgressEvent<ExportWalk>('unixfs:exporter:walk:hamt-sharded-directory', {
      cid
    }))

    return listDirectory(node, path, blockstore, options)
  }

  return yieldHamtDirectoryContent
}
