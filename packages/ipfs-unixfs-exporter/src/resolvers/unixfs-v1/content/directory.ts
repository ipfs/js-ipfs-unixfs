import type { ExporterOptions, UnixfsV1DirectoryContent, UnixfsV1Resolver } from '../../../index.js'

const directoryContent: UnixfsV1Resolver = (cid, node, unixfs, path, resolve, depth, blockstore) => {
  async function * yieldDirectoryContent (options: ExporterOptions = {}): UnixfsV1DirectoryContent {
    const offset = options.offset ?? 0
    const length = options.length ?? node.Links.length
    const links = node.Links.slice(offset, length)

    for (const link of links) {
      const result = await resolve(link.Hash, link.Name ?? '', `${path}/${link.Name ?? ''}`, [], depth + 1, blockstore, options)

      if (result.entry != null) {
        yield result.entry
      }
    }
  }

  return yieldDirectoryContent
}

export default directoryContent
