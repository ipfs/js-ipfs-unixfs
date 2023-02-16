import { UnixFS } from 'ipfs-unixfs'
import { persist, PersistOptions } from '../utils/persist.js'
import * as dagPb from '@ipld/dag-pb'
import * as raw from 'multiformats/codecs/raw'
import type { BufferImporter, ProgressHandler } from '../index.js'
import type { Version } from 'multiformats/cid'

export interface BufferImporterOptions {
  cidVersion: Version
  rawLeaves: boolean
  leafType: 'file' | 'raw'
  progress?: ProgressHandler
}

export function defaultBufferImporter (options: BufferImporterOptions): BufferImporter {
  return async function * bufferImporter (file, block) {
    for await (let buffer of file.content) {
      yield async () => {
        options.progress?.(buffer.length, file.path)
        let unixfs

        const opts: PersistOptions = {
          codec: dagPb,
          cidVersion: options.cidVersion
        }

        if (options.rawLeaves) {
          opts.codec = raw
          opts.cidVersion = 1
        } else {
          unixfs = new UnixFS({
            type: options.leafType,
            data: buffer
          })

          buffer = dagPb.encode({
            Data: unixfs.marshal(),
            Links: []
          })
        }

        return {
          cid: await persist(buffer, block, opts),
          unixfs,
          size: BigInt(buffer.length)
        }
      }
    }
  }
}
