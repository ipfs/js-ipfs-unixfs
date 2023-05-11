import * as dagPb from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import * as raw from 'multiformats/codecs/raw'
import { CustomProgressEvent } from 'progress-events'
import { persist, type PersistOptions } from '../utils/persist.js'
import type { BufferImporter } from '../index.js'
import type { CID, Version } from 'multiformats/cid'
import type { ProgressOptions, ProgressEvent } from 'progress-events'

/**
 * Passed to the onProgress callback while importing files
 */
export interface ImportWriteProgress {
  /**
   * How many bytes we have written for this source so far - this may be
   * bigger than the file size due to the DAG-PB wrappers of each block
   */
  bytesWritten: bigint

  /**
   * The CID of the block that has been written
   */
  cid: CID

  /**
   * The path of the file being imported, if one was specified
   */
  path?: string
}

export type BufferImportProgressEvents =
  ProgressEvent<'unixfs:importer:progress:file:write', ImportWriteProgress>

export interface BufferImporterOptions extends ProgressOptions<BufferImportProgressEvents> {
  cidVersion: Version
  rawLeaves: boolean
  leafType: 'file' | 'raw'
}

export function defaultBufferImporter (options: BufferImporterOptions): BufferImporter {
  return async function * bufferImporter (file, blockstore) {
    let bytesWritten = 0n

    for await (let block of file.content) {
      yield async () => { // eslint-disable-line no-loop-func
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

        const cid = await persist(block, blockstore, opts)

        bytesWritten += BigInt(block.byteLength)

        options.onProgress?.(new CustomProgressEvent<ImportWriteProgress>('unixfs:importer:progress:file:write', {
          bytesWritten,
          cid,
          path: file.path
        }))

        return {
          cid,
          unixfs,
          size: BigInt(block.length),
          block
        }
      }
    }
  }
}
