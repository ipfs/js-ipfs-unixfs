import filter from 'it-filter'
import map from 'it-map'
import parallel from 'it-parallel'
import { pipe } from 'it-pipe'
import { CustomProgressEvent } from 'progress-events'
import { isBasicExporterOptions } from '../../../utils/is-basic-exporter-options.ts'
import type { BasicExporterOptions, ExporterOptions, ExportWalk, UnixFSEntry, UnixfsV1BasicContent, UnixfsV1Resolver } from '../../../index.js'

const directoryContent: UnixfsV1Resolver = (cid, node, unixfs, path, resolve, depth, blockstore) => {
  async function * yieldDirectoryContent (options: ExporterOptions | BasicExporterOptions = {}): any {
    const offset = options.offset ?? 0
    const length = options.length ?? node.Links.length
    const links = node.Links.slice(offset, length)

    options.onProgress?.(new CustomProgressEvent<ExportWalk>('unixfs:exporter:walk:directory', {
      cid
    }))

    yield * pipe(
      links,
      source => map(source, link => {
        return async () => {
          const linkName = link.Name ?? ''
          const linkPath = `${path}/${linkName}`

          const load = async (options = {}): Promise<UnixFSEntry> => {
            const result = await resolve(link.Hash, linkName, linkPath, [], depth + 1, blockstore, options)
            return result.entry
          }

          if (isBasicExporterOptions(options)) {
            const basic: UnixfsV1BasicContent = {
              cid: link.Hash,
              name: linkName,
              path: linkPath,
              resolve: load
            }

            return basic
          }

          return load(options)
        }
      }),
      source => parallel(source, {
        ordered: true,
        concurrency: options.blockReadConcurrency
      }),
      source => filter(source, entry => entry != null)
    )
  }

  return yieldDirectoryContent
}

export default directoryContent
