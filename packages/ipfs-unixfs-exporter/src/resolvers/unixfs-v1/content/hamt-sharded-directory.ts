import parallel from 'it-parallel'
import { pipe } from 'it-pipe'
import map from 'it-map'
import { decode, PBNode } from '@ipld/dag-pb'
import type { Blockstore } from 'interface-blockstore'
import type { ExporterOptions, Resolve, UnixfsV1DirectoryContent, UnixfsV1Resolver } from '../../../index.js'

/**
 * @typedef {import('interface-blockstore').Blockstore} Blockstore
 * @typedef {import('../../../types').ExporterOptions} ExporterOptions
 * @typedef {import('../../../types').Resolve} Resolve
 * @typedef {import('../../../types').UnixfsV1DirectoryContent} UnixfsV1DirectoryContent
 * @typedef {import('../../../types').UnixfsV1Resolver} UnixfsV1Resolver
 * @typedef {import('@ipld/dag-pb').PBNode} PBNode
 */

const hamtShardedDirectoryContent: UnixfsV1Resolver = (cid, node, unixfs, path, resolve, depth, blockstore) => {
  function yieldHamtDirectoryContent (options: ExporterOptions = {}): UnixfsV1DirectoryContent {
    return listDirectory(node, path, resolve, depth, blockstore, options)
  }

  return yieldHamtDirectoryContent
}

async function * listDirectory (node: PBNode, path: string, resolve: Resolve, depth: number, blockstore: Blockstore, options: ExporterOptions): UnixfsV1DirectoryContent {
  const links = node.Links

  const results = pipe(
    links,
    source => map(source, link => {
      return async () => {
        const name = link.Name != null ? link.Name.substring(2) : null

        if (name != null && name !== '') {
          const result = await resolve(link.Hash, name, `${path}/${name}`, [], depth + 1, blockstore, options)

          return { entries: result.entry == null ? [] : [result.entry] }
        } else {
          // descend into subshard
          const block = await blockstore.get(link.Hash)
          node = decode(block)

          return { entries: listDirectory(node, path, resolve, depth, blockstore, options) }
        }
      }
    }),
    source => parallel(source, { ordered: true })
  )

  for await (const { entries } of results) {
    yield * entries
  }
}

export default hamtShardedDirectoryContent
