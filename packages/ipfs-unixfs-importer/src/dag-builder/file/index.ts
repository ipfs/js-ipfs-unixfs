import errCode from 'err-code'
import { UnixFS } from 'ipfs-unixfs'
import { persist } from '../../utils/persist.js'
import { encode, prepare } from '@ipld/dag-pb'
import parallelBatch from 'it-parallel-batch'
import * as rawCodec from 'multiformats/codecs/raw'
import * as dagPb from '@ipld/dag-pb'

import { flat } from './flat.js'
import { balanced } from './balanced.js'
import { trickle } from './trickle.js'
import { bufferImporter } from './buffer-importer.js'
import type { File, FileDAGBuilder, ImporterOptions, InProgressImportResult, Reducer, UnixFSV1DagBuilder } from '../../index.js'
import type { Blockstore } from 'interface-blockstore'

const dagBuilders: Record<string, FileDAGBuilder> = {
  flat,
  balanced,
  trickle
}

async function * buildFileBatch (file: File, blockstore: Blockstore, options: ImporterOptions): AsyncGenerator<InProgressImportResult> {
  let count = -1
  let previous
  let importer

  if (typeof options.bufferImporter === 'function') {
    importer = options.bufferImporter
  } else {
    importer = bufferImporter
  }

  for await (const entry of parallelBatch(importer(file, blockstore, options), options.blockWriteConcurrency)) {
    count++

    if (count === 0) {
      previous = entry
      continue
    } else if (count === 1 && (previous != null)) {
      yield previous
      previous = null
    }

    yield entry
  }

  if (previous != null) {
    previous.single = true
    yield previous
  }
}

const reduce = (file: File, blockstore: Blockstore, options: ImporterOptions): Reducer => {
  const reducer: Reducer = async function (leaves) {
    if (leaves.length === 1 && leaves[0]?.single === true && options.reduceSingleLeafToSelf) {
      const leaf = leaves[0]

      if (file.mtime !== undefined || file.mode !== undefined) {
        // only one leaf node which is a buffer - we have metadata so convert it into a
        // UnixFS entry otherwise we'll have nowhere to store the metadata
        let buffer = await blockstore.get(leaf.cid)

        leaf.unixfs = new UnixFS({
          type: 'file',
          mtime: file.mtime,
          mode: file.mode,
          data: buffer
        })

        buffer = encode(prepare({ Data: leaf.unixfs.marshal() }))

        // // TODO vmx 2021-03-26: This is what the original code does, it checks
        // // the multihash of the original leaf node and uses then the same
        // // hasher. i wonder if that's really needed or if we could just use
        // // the hasher from `options.hasher` instead.
        // const multihash = mh.decode(leaf.cid.multihash.bytes)
        // let hasher
        // switch multihash {
        //   case sha256.code {
        //     hasher = sha256
        //     break;
        //   }
        //   //case identity.code {
        //   //  hasher = identity
        //   //  break;
        //   //}
        //   default: {
        //     throw new Error(`Unsupported hasher "${multihash}"`)
        //   }
        // }
        leaf.cid = await persist(buffer, blockstore, {
          ...options,
          codec: dagPb,
          hasher: options.hasher,
          cidVersion: options.cidVersion
        })
        leaf.size = BigInt(buffer.length)
      }

      return {
        cid: leaf.cid,
        path: file.path,
        unixfs: leaf.unixfs,
        size: leaf.size
      }
    }

    // create a parent node and add all the leaves
    const f = new UnixFS({
      type: 'file',
      mtime: file.mtime,
      mode: file.mode
    })

    const links: dagPb.PBLink[] = leaves
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
    const buffer = encode(prepare(node))
    const cid = await persist(buffer, blockstore, options)

    return {
      cid,
      path: file.path,
      unixfs: f,
      size: BigInt(buffer.length + node.Links.reduce((acc, curr) => acc + (curr.Tsize ?? 0), 0))
    }
  }

  return reducer
}

export const fileBuilder: UnixFSV1DagBuilder<File> = async (file, block, options) => {
  const dagBuilder = dagBuilders[options.strategy]

  if (dagBuilder == null) {
    throw errCode(new Error(`Unknown importer build strategy name: ${options.strategy}`), 'ERR_BAD_STRATEGY')
  }

  return await dagBuilder(buildFileBatch(file, block, options), reduce(file, block, options), options)
}
