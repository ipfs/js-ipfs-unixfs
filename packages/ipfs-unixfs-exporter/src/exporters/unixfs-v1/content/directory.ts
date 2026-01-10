import { CustomProgressEvent } from 'progress-events'
import type { ExporterOptions, ExportWalk, UnixFSDirectoryEntry } from '../../../index.js'
import type { PBNode } from '@ipld/dag-pb'
import type { CID } from 'multiformats/cid'

export function directoryContent (cid: CID, node: PBNode): (options: ExporterOptions) => AsyncGenerator<UnixFSDirectoryEntry> {
  async function * yieldDirectoryContent (options: ExporterOptions = {}): AsyncGenerator<UnixFSDirectoryEntry> {
    const offset = options.offset ?? 0
    const length = options.length ?? node.Links.length
    const links = node.Links.slice(offset, length)

    options.onProgress?.(new CustomProgressEvent<ExportWalk>('unixfs:exporter:walk:directory', {
      cid
    }))

    yield * links.map(link => ({
      cid: link.Hash,
      name: link.Name ?? ''
    }))
  }

  return yieldDirectoryContent
}

export default directoryContent
