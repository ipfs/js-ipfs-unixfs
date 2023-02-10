import parallelBatch from 'it-parallel-batch'
import defaultOptions from './options.js'
import { dagBuilder } from './dag-builder/index.js'
import { treeBuilder } from './tree-builder.js'
import type { UnixFS, Mtime } from 'ipfs-unixfs'
import type { CID, Version as CIDVersion } from 'multiformats/cid'
import type { MultihashHasher } from 'multiformats/hashes/interface'
import type { Blockstore } from 'interface-blockstore'

export interface ImportCandidate {
  path?: string
  content?: AsyncIterable<Uint8Array> | Iterable<Uint8Array> | Uint8Array
  mtime?: Mtime
  mode?: number
}

export interface File {
  content: AsyncIterable<Uint8Array>
  path?: string
  mtime?: Mtime
  mode?: number
}

export interface Directory {
  path?: string
  mtime?: Mtime
  mode?: number
}

export interface ImportResult {
  cid: CID
  size: bigint
  path?: string
  unixfs?: UnixFS
}

export interface InProgressImportResult extends ImportResult {
  single?: boolean
}

export type ChunkerType = 'fixed' | 'rabin'
export interface ProgressHandler { (chunkSize: number, path?: string): void }
export interface HamtHashFn { (value: Uint8Array): Promise<Uint8Array> }
export interface Chunker { (source: AsyncIterable<Uint8Array>, options: ImporterOptions): AsyncIterable<Uint8Array> }
export interface DAGBuilder { (source: AsyncIterable<ImportCandidate> | Iterable<ImportCandidate>, blockstore: Blockstore, options: ImporterOptions): AsyncIterable<() => Promise<InProgressImportResult>> }
export interface TreeBuilder { (source: AsyncIterable<InProgressImportResult>, blockstore: Blockstore, options: ImporterOptions): AsyncIterable<ImportResult> }
export interface BufferImporter { (file: File, blockstore: Blockstore, options: ImporterOptions): AsyncIterable<() => Promise<InProgressImportResult>> }
export interface ChunkValidator { (source: AsyncIterable<Uint8Array>, options: ImporterOptions): AsyncIterable<Uint8Array> }
export interface UnixFSV1DagBuilder<T> { (item: T, blockstore: Blockstore, options: ImporterOptions): Promise<InProgressImportResult> }
export interface Reducer { (leaves: InProgressImportResult[]): Promise<InProgressImportResult> }

export interface FileDAGBuilder { (source: AsyncIterable<InProgressImportResult> | Iterable<InProgressImportResult>, reducer: Reducer, options: ImporterOptions): Promise<InProgressImportResult> }

export interface UserImporterOptions {
  strategy?: 'balanced' | 'flat' | 'trickle'
  rawLeaves?: boolean
  onlyHash?: boolean
  reduceSingleLeafToSelf?: boolean
  hasher?: MultihashHasher
  leafType?: 'file' | 'raw'
  cidVersion?: CIDVersion
  progress?: ProgressHandler
  shardSplitThresholdBytes?: number
  fileImportConcurrency?: number
  blockWriteConcurrency?: number
  minChunkSize?: number
  maxChunkSize?: number
  avgChunkSize?: number
  window?: number
  polynomial?: number
  maxChildrenPerNode?: number
  layerRepeat?: number
  wrapWithDirectory?: boolean
  recursive?: boolean
  hidden?: boolean
  timeout?: number
  hamtHashFn?: HamtHashFn
  hamtBucketBits?: number
  hamtHashCode?: bigint
  chunker?: ChunkerType | Chunker
  dagBuilder?: DAGBuilder
  treeBuilder?: TreeBuilder
  bufferImporter?: BufferImporter
  chunkValidator?: ChunkValidator
}

export interface ImporterOptions {
  strategy: 'balanced' | 'flat' | 'trickle'
  rawLeaves: boolean
  onlyHash: boolean
  reduceSingleLeafToSelf: boolean
  hasher: MultihashHasher
  leafType: 'file' | 'raw'
  cidVersion: CIDVersion
  progress: ProgressHandler
  shardSplitThresholdBytes: number
  fileImportConcurrency: number
  blockWriteConcurrency: number
  minChunkSize: number
  maxChunkSize: number
  avgChunkSize: number
  window: number
  polynomial: number
  maxChildrenPerNode: number
  layerRepeat: number
  wrapWithDirectory: boolean
  recursive: boolean
  hidden: boolean
  timeout?: number
  hamtHashFn: HamtHashFn
  hamtBucketBits: number
  hamtHashCode: bigint
  chunker: ChunkerType | Chunker
  dagBuilder?: DAGBuilder
  treeBuilder?: TreeBuilder
  bufferImporter?: BufferImporter
  chunkValidator?: ChunkValidator
}

export async function * importer (source: AsyncIterable<ImportCandidate> | Iterable<ImportCandidate> | ImportCandidate, blockstore: Blockstore, options: UserImporterOptions = {}): AsyncGenerator<ImportResult, void, unknown> {
  const opts = defaultOptions(options)

  let buildDag

  if (typeof options.dagBuilder === 'function') {
    buildDag = options.dagBuilder
  } else {
    buildDag = dagBuilder
  }

  let buildTree

  if (typeof options.treeBuilder === 'function') {
    buildTree = options.treeBuilder
  } else {
    buildTree = treeBuilder
  }

  let candidates: AsyncIterable<ImportCandidate> | Iterable<ImportCandidate>

  if (Symbol.asyncIterator in source || Symbol.iterator in source) {
    candidates = source
  } else {
    candidates = [source]
  }

  for await (const entry of buildTree(parallelBatch(buildDag(candidates, blockstore, opts), opts.fileImportConcurrency), blockstore, opts)) {
    yield {
      cid: entry.cid,
      path: entry.path,
      unixfs: entry.unixfs,
      size: entry.size
    }
  }
}
