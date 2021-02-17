'use strict'

const parallelBatch = require('it-parallel-batch')
const defaultOptions = require('./options')

/**
 * @typedef {import('cids')} CID
 * @typedef {import('ipfs-unixfs')} UnixFS
 *
 * @typedef {object} Block
 * @property {Uint8Array} data
 * @property {CID} cid
 *
 * @typedef {object} BlockAPI
 * @property {(cid: CID, options?: any) => Promise<Block>} get
 * @property {(buffer: Uint8Array, options: any) => Promise<Block>} put
 *
 * @typedef {object} ImportCandidate
 * @property {string} [path]
 * @property {AsyncIterable<Uint8Array> | Iterable<Uint8Array> | Uint8Array | ArrayLike<number> | string} [content]
 * @property {import('ipfs-unixfs').Mtime | Date} [mtime]
 * @property {number} [mode]
 *
 * @typedef {object} File
 * @property {AsyncIterable<Uint8Array>} content
 * @property {string} [path]
 * @property {import('ipfs-unixfs').Mtime | Date} [mtime]
 * @property {number} [mode]
 *
 * @typedef {object} Directory
 * @property {string} path
 * @property {import('ipfs-unixfs').Mtime | Date} [mtime]
 * @property {number} [mode]
 *
 * @typedef {object} ImportResult
 * @property {CID} cid
 * @property {number} size
 * @property {string} [path]
 * @property {UnixFS} [unixfs]
 *
 * @typedef {object} PartialImportResult
 * @property {CID} cid
 * @property {number} size
 * @property {string} [path]
 * @property {UnixFS} [unixfs]
 * @property {boolean} [single]
 *
 * @typedef {'fixed'|'rabin'} ChunkerType
 *
 * @typedef {object} UserImporterOptions
 * @property {ChunkerType | import('./chunker').Chunker} [chunker='fixed']
 * @property {'balanced'|'flat'|'trickle'} [strategy='balanced']
 * @property {boolean} [rawLeaves=false]
 * @property {boolean} [onlyHash=false]
 * @property {boolean} [reduceSingleLeafToSelf=true]
 * @property {import('multicodec').CodecName} [hashAlg='sha2-256']
 * @property {'file'|'raw'} [leafType='file']
 * @property {import('cids').CIDVersion} [cidVersion=0]
 * @property {(chunkSize: number, path?: string) => void} [progress=() => {}]
 * @property {number} [shardSplitThreshold=1000]
 * @property {number} [fileImportConcurrency=50]
 * @property {number} [blockWriteConcurrency=10]
 * @property {number} [minChunkSize=262144]
 * @property {number} [maxChunkSize=262144]
 * @property {number} [avgChunkSize=262144]
 * @property {number} [window=16]
 * @property {number} [polynomial=17437180132763653]
 * @property {number} [maxChildrenPerNode=174]
 * @property {number} [layerRepeat=4]
 * @property {boolean} [wrapWithDirectory=false]
 * @property {boolean} [pin=false]
 * @property {boolean} [recursive=false]
 * @property {boolean} [hidden=false]
 * @property {boolean} [preload=false]
 * @property {string | number} [timeout]
 * @property {(value: Uint8Array) => Promise<Uint8Array>} [hamtHashFn]
 * @property {number} [hamtBucketBits=8]
 * @property {number} [hamtHashCode=0x22]
 * @property {import('./dag-builder').DAGBuilder} [dagBuilder]
 * @property {import('./tree-builder').TreeBuilder} [treeBuilder]
 * @property {import('./dag-builder/file/buffer-importer').BufferImporter} [bufferImporter]
 * @property {import('./dag-builder/validate-chunks').ChunkValidator} [chunkValidator]
 *
 * @typedef {object} ImporterOptions
 * @property {ChunkerType} chunker
 * @property {'balanced'|'flat'|'trickle'} strategy
 * @property {boolean} rawLeaves
 * @property {boolean} onlyHash
 * @property {boolean} reduceSingleLeafToSelf
 * @property {'dag-pb'|'raw'} codec
 * @property {import('multihashing-async').multihash.HashName} hashAlg
 * @property {'file'|'raw'} leafType
 * @property {import('cids').CIDVersion} cidVersion
 * @property {(chunkSize: number, path?: string) => void} progress
 * @property {number} shardSplitThreshold
 * @property {number} fileImportConcurrency
 * @property {number} blockWriteConcurrency
 * @property {number} minChunkSize
 * @property {number} maxChunkSize
 * @property {number} avgChunkSize
 * @property {number} window
 * @property {number} polynomial
 * @property {number} maxChildrenPerNode
 * @property {number} layerRepeat
 * @property {boolean} wrapWithDirectory
 * @property {boolean} pin
 * @property {boolean} recursive
 * @property {boolean} hidden
 * @property {boolean} preload
 * @property {string | number | undefined} timeout
 * @property {(value: Uint8Array) => Promise<Uint8Array>} hamtHashFn
 * @property {number} hamtHashCode
 * @property {number} hamtBucketBits
 * @property {import('./dag-builder').DAGBuilder} [dagBuilder]
 * @property {import('./tree-builder').TreeBuilder} [treeBuilder]
 * @property {import('./dag-builder/file/buffer-importer').BufferImporter} [bufferImporter]
 * @property {import('./dag-builder/validate-chunks').ChunkValidator} [chunkValidator]
 */

/**
 * @param {AsyncIterable<ImportCandidate> | Iterable<ImportCandidate>} source
 * @param {BlockAPI} block
 * @param {UserImporterOptions} options
 */
module.exports = async function * (source, block, options = {}) {
  const opts = defaultOptions(options)

  let dagBuilder

  if (typeof options.dagBuilder === 'function') {
    dagBuilder = options.dagBuilder
  } else {
    dagBuilder = require('./dag-builder')
  }

  let treeBuilder

  if (typeof options.treeBuilder === 'function') {
    treeBuilder = options.treeBuilder
  } else {
    treeBuilder = require('./tree-builder')
  }

  for await (const entry of treeBuilder(parallelBatch(dagBuilder(source, block, opts), opts.fileImportConcurrency), block, opts)) {
    yield {
      cid: entry.cid,
      path: entry.path,
      unixfs: entry.unixfs,
      size: entry.size
    }
  }
}
