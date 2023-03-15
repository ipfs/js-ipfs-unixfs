import { UnixFS } from 'ipfs-unixfs'
import { persist, PersistOptions } from '../utils/persist.js'
import * as dagPb from '@ipld/dag-pb'
import * as raw from 'multiformats/codecs/raw'
import type { BufferImporter } from '../index.js'
import type { Version } from 'multiformats/cid'
import { CustomProgressEvent } from 'progress-events'
import type { ProgressOptions, ProgressEvent } from 'progress-events'

/**
 * Passed to the onProgress callback while importing files
 */
export interface ImportProgressData {
  /**
   * The size of the current chunk
   */
  bytes: number

  /**
   * The path of the file being imported, if one was specified
   */
  path?: string
}

export type BufferImportProgressEvents =
  ProgressEvent<'unixfs:importer:progress', ImportProgressData>

export interface BufferImporterOptions extends ProgressOptions<BufferImportProgressEvents> {
  cidVersion: Version
  rawLeaves: boolean
  leafType: 'file' | 'raw'
}

export function defaultBufferImporter (options: BufferImporterOptions): BufferImporter {
  return async function * bufferImporter (file, blockstore) {
    for await (let block of file.content) {
      yield async () => {
        options.onProgress?.(new CustomProgressEvent<ImportProgressData>('unixfs:importer:progress', { bytes: block.byteLength, path: file.path }))
        let unixfs

        const opts: PersistOptions = {
          codec: dagPb,
          cidVersion: options.cidVersion,
          onProgress: options.onProgress
        }

        if (options.rawLeaves) {
          opts.codec = raw
          opts.cidVersion = 1
        } else {
          unixfs = new UnixFS({
            type: options.leafType,
            data: block
          })

          block = dagPb.encode({
            Data: unixfs.marshal(),
            Links: []
          })
        }

        return {
          cid: await persist(block, blockstore, opts),
          unixfs,
          size: BigInt(block.length),
          block
        }
      }
    }
  }
}
