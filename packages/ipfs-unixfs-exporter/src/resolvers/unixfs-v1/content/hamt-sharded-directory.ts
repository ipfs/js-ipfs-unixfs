import { decode } from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import map from 'it-map'
import parallel from 'it-parallel'
import { pipe } from 'it-pipe'
import { CustomProgressEvent } from 'progress-events'
import { NotUnixFSError } from '../../../errors.js'
import { isBasicExporterOptions } from '../../../utils/is-basic-exporter-options.ts'
import type { ExporterOptions, Resolve, UnixfsV1DirectoryContent, UnixfsV1Resolver, ReadableStorage, ExportWalk, BasicExporterOptions, UnixFSBasicEntry } from '../../../index.js'
import type { PBNode } from '@ipld/dag-pb'

const hamtShardedDirectoryContent: UnixfsV1Resolver = (cid, node, unixfs, path, resolve, depth, blockstore) => {
  function yieldHamtDirectoryContent (options: ExporterOptions | BasicExporterOptions = {}): UnixfsV1DirectoryContent {
    options.onProgress?.(new CustomProgressEvent<ExportWalk>('unixfs:exporter:walk:hamt-sharded-directory', {
      cid
    }))

    return listDirectory(node, path, resolve, depth, blockstore, options)
  }

  return yieldHamtDirectoryContent
}

async function * listDirectory (node: PBNode, path: string, resolve: Resolve, depth: number, blockstore: ReadableStorage, options: ExporterOptions | BasicExporterOptions): any {
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
          const linkPath = `${path}/${name}`

          if (isBasicExporterOptions(options)) {
            const basic: UnixFSBasicEntry = {
              cid: link.Hash,
              name,
              path: linkPath
            }

            return {
              entries: [
                basic
              ]
            }
          }

          const result = await resolve(link.Hash, name, linkPath, [], depth + 1, blockstore, options)

          return {
            entries: [
              result.entry
            ].filter(Boolean)
          }
        } else {
          // descend into subshard
          const block = await blockstore.get(link.Hash, options)
          node = decode(block)

          options.onProgress?.(new CustomProgressEvent<ExportWalk>('unixfs:exporter:walk:hamt-sharded-directory', {
            cid: link.Hash
          }))

          return {
            entries: listDirectory(node, path, resolve, depth, blockstore, options)
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

export default hamtShardedDirectoryContent
