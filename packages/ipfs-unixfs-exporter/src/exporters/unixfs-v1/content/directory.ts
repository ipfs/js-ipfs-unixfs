import { CustomProgressEvent } from 'progress-events'
import type { ExportContentOptions, ExportWalk, UnixFSDirectoryEntry } from '../../../index.js'
import type { PBNode } from '@ipld/dag-pb'
import type { UnixFS } from 'ipfs-unixfs'
import type { CID } from 'multiformats/cid'

export function directoryContent (cid: CID, node: PBNode, unixfs: UnixFS, path: string): (options: ExportContentOptions) => AsyncGenerator<UnixFSDirectoryEntry> {
  async function * yieldDirectoryContent (options: ExportContentOptions = {}): AsyncGenerator<UnixFSDirectoryEntry> {
    const offset = options.offset ?? 0
    const length = options.length ?? node.Links.length
    const links = node.Links.slice(offset, length)

    options.onProgress?.(new CustomProgressEvent<ExportWalk>('unixfs:exporter:walk:directory', {
      cid
    }))

    yield * links.map(link => ({
      cid: link.Hash,
      name: link.Name ?? '',
      path: `${path}/${link.Name ?? ''}`
    }))
  }

  return yieldDirectoryContent
}

export default directoryContent
