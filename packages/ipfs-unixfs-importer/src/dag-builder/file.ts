import { UnixFS } from 'ipfs-unixfs'
import { persist } from '../utils/persist.js'
import { encode, PBLink, prepare } from '@ipld/dag-pb'
import parallelBatch from 'it-parallel-batch'
import * as rawCodec from 'multiformats/codecs/raw'
import type { BufferImporter, File, InProgressImportResult, Blockstore, SingleBlockImportResult } from '../index.js'
import type { FileLayout, Reducer } from '../layout/index.js'
import type { Version } from 'multiformats/cid'
import type { ProgressOptions } from 'progress-events'

interface BuildFileBatchOptions {
  bufferImporter: BufferImporter
  blockWriteConcurrency: number
}

async function * buildFileBatch (file: File, blockstore: Blockstore, options: BuildFileBatchOptions): AsyncGenerator<InProgressImportResult> {
  let count = -1
  let previous: SingleBlockImportResult | undefined

  for await (const entry of parallelBatch(options.bufferImporter(file, blockstore), options.blockWriteConcurrency)) {
    count++

    if (count === 0) {
      // cache the first entry if case there aren't any more
      previous = {
        ...entry,
        single: true
      }

      continue
    } else if (count === 1 && (previous != null)) {
      // we have the second block of a multiple block import so yield the first
      yield {
        ...previous,
        block: undefined,
        single: undefined
      }
      previous = undefined
    }

    // yield the second or later block of a multiple block import
    yield {
      ...entry,
      block: undefined
    }
  }

  if (previous != null) {
    yield previous
  }
}

interface ReduceOptions extends ProgressOptions {
  reduceSingleLeafToSelf: boolean
  cidVersion: Version
  signal?: AbortSignal
}

function isSingleBlockImport (result: any): result is SingleBlockImportResult {
  return result.single === true
}

const reduce = (file: File, blockstore: Blockstore, options: ReduceOptions): Reducer => {
  const reducer: Reducer = async function (leaves) {
    if (leaves.length === 1 && isSingleBlockImport(leaves[0]) && options.reduceSingleLeafToSelf) {
      const leaf = leaves[0]

      if (isSingleBlockImport(leaf) && (file.mtime !== undefined || file.mode !== undefined)) {
        // only one leaf node which is a raw leaf - we have metadata so convert it into a
        // UnixFS entry otherwise we'll have nowhere to store the metadata
        leaf.unixfs = new UnixFS({
          type: 'file',
          mtime: file.mtime,
          mode: file.mode,
          data: leaf.block
        })

        leaf.block = encode(prepare({ Data: leaf.unixfs.marshal() }))

        leaf.cid = await persist(leaf.block, blockstore, {
          ...options,
          cidVersion: options.cidVersion
        })
        leaf.size = BigInt(leaf.block.length)
      }

      return {
        cid: leaf.cid,
        path: file.path,
        unixfs: leaf.unixfs,
        size: leaf.size,
        originalPath: leaf.originalPath
      }
    }

    // create a parent node and add all the leaves
    const f = new UnixFS({
      type: 'file',
      mtime: file.mtime,
      mode: file.mode
    })

    const links: PBLink[] = leaves
      .filter(leaf => {
        if (leaf.cid.code === rawCodec.code && leaf.size > 0) {
          return true
        }

        if ((leaf.unixfs != null) && (leaf.unixfs.data == null) && leaf.unixfs.fileSize() > 0n) {
          return true
        }

        return Boolean(leaf.unixfs?.data?.length)
      })
      .map((leaf) => {
        if (leaf.cid.code === rawCodec.code) {
          // node is a leaf buffer
          f.addBlockSize(leaf.size)

          return {
            Name: '',
            Tsize: Number(leaf.size),
            Hash: leaf.cid
          }
        }

        if ((leaf.unixfs == null) || (leaf.unixfs.data == null)) {
          // node is an intermediate node
          f.addBlockSize(leaf.unixfs?.fileSize() ?? 0n)
        } else {
          // node is a unixfs 'file' leaf node
          f.addBlockSize(BigInt(leaf.unixfs.data.length))
        }

        return {
          Name: '',
          Tsize: Number(leaf.size),
          Hash: leaf.cid
        }
      })

    const node = {
      Data: f.marshal(),
      Links: links
    }
    const block = encode(prepare(node))
    const cid = await persist(block, blockstore, options)

    return {
      cid,
      path: file.path,
      unixfs: f,
      size: BigInt(block.length + node.Links.reduce((acc, curr) => acc + (curr.Tsize ?? 0), 0)),
      originalPath: file.originalPath,
      block
    }
  }

  return reducer
}

export interface FileBuilderOptions extends BuildFileBatchOptions, ReduceOptions {
  layout: FileLayout
}

export const fileBuilder = async (file: File, block: Blockstore, options: FileBuilderOptions): Promise<InProgressImportResult> => {
  return await options.layout(buildFileBatch(file, block, options), reduce(file, block, options))
}