import errcode from 'err-code'
import first from 'it-first'
import parallelBatch from 'it-parallel-batch'
import { fixedSize } from './chunker/fixed-size.js'
import { type BufferImportProgressEvents, defaultBufferImporter } from './dag-builder/buffer-importer.js'
import { type DAGBuilder, type DagBuilderProgressEvents, defaultDagBuilder } from './dag-builder/index.js'
import { type ChunkValidator, defaultChunkValidator } from './dag-builder/validate-chunks.js'
import { balanced, type FileLayout } from './layout/index.js'
import { defaultTreeBuilder } from './tree-builder.js'
import type { Chunker } from './chunker/index.js'
import type { ReducerProgressEvents } from './dag-builder/file.js'
import type { Blockstore } from 'interface-blockstore'
import type { AwaitIterable } from 'interface-store'
import type { UnixFS, Mtime } from 'ipfs-unixfs'
import type { CID, Version as CIDVersion } from 'multiformats/cid'
import type { ProgressOptions } from 'progress-events'

export type ByteStream = AwaitIterable<Uint8Array>
export type ImportContent = ByteStream | Uint8Array

export type WritableStorage = Pick<Blockstore, 'put'>

export interface FileCandidate {
  path?: string
  content: ImportContent
  mtime?: Mtime
  mode?: number
}

export interface DirectoryCandidate {
  path: string
  mtime?: Mtime
  mode?: number
}

export type ImportCandidate = FileCandidate | DirectoryCandidate

export interface File {
  content: AsyncIterable<Uint8Array>
  path?: string
  mtime?: Mtime
  mode?: number
  originalPath?: string
}

export interface Directory {
  path?: string
  mtime?: Mtime
  mode?: number
  originalPath?: string
}

export interface ImportResult {
  cid: CID
  size: bigint
  path?: string
  unixfs?: UnixFS
}

export interface MultipleBlockImportResult extends ImportResult {
  originalPath?: string
}

export interface SingleBlockImportResult extends ImportResult {
  single: true
  originalPath?: string
  block: Uint8Array
}

export type InProgressImportResult = SingleBlockImportResult | MultipleBlockImportResult

export interface BufferImporterResult extends ImportResult {
  block: Uint8Array
}

export interface HamtHashFn { (value: Uint8Array): Promise<Uint8Array> }
export interface TreeBuilder { (source: AsyncIterable<InProgressImportResult>, blockstore: WritableStorage): AsyncIterable<ImportResult> }
export interface BufferImporter { (file: File, blockstore: WritableStorage): AsyncIterable<() => Promise<BufferImporterResult>> }

export type ImporterProgressEvents =
  BufferImportProgressEvents |
  DagBuilderProgressEvents |
  ReducerProgressEvents

/**
 * Options to control the importer's behaviour
 */
export interface ImporterOptions extends ProgressOptions<ImporterProgressEvents> {
  /**
   * When a file would span multiple DAGNodes, if this is true the leaf nodes
   * will not be wrapped in `UnixFS` protobufs and will instead contain the
   * raw file bytes. Default: true
   */
  rawLeaves?: boolean

  /**
   * If the file being imported is small enough to fit into one DAGNodes, store
   * the file data in the root node along with the UnixFS metadata instead of
   * in a leaf node which would then require additional I/O to load. Default: true
   */
  reduceSingleLeafToSelf?: boolean

  /**
   * What type of UnixFS node leaves should be - can be `'file'` or `'raw'`
   * (ignored when `rawLeaves` is `true`).
   *
   * This option exists to simulate kubo's trickle dag which uses a combination
   * of `'raw'` UnixFS leaves and `reduceSingleLeafToSelf: false`.
   *
   * For modern code the `rawLeaves: true` option should be used instead so leaves
   * are plain Uint8Arrays without a UnixFS/Protobuf wrapper.
   */
  leafType?: 'file' | 'raw'

  /**
   * the CID version to use when storing the data. Default: 1
   */
  cidVersion?: CIDVersion

  /**
   * If the serialized node is larger than this it might be converted to a HAMT
   * sharded directory. Default: 256KiB
   */
  shardSplitThresholdBytes?: number

  /**
   * How many files to import concurrently. For large numbers of small files this
   * should be high (e.g. 50). Default: 10
   */
  fileImportConcurrency?: number

  /**
   * How many blocks to hash and write to the block store concurrently. For small
   * numbers of large files this should be high (e.g. 50). Default: 50
   */
  blockWriteConcurrency?: number

  /**
   * If true, all imported files and folders will be contained in a directory that
   * will correspond to the CID of the final entry yielded. Default: false
   */
  wrapWithDirectory?: boolean

  /**
   * The chunking strategy. See [./src/chunker/index.ts](./src/chunker/index.ts)
   * for available chunkers. Default: fixedSize
   */
  chunker?: Chunker

  /**
   * How the DAG that represents files are created. See
   * [./src/layout/index.ts](./src/layout/index.ts) for available layouts. Default: balanced
   */
  layout?: FileLayout

  /**
   * This option can be used to override the importer internals.
   *
   * This function should read `{ path, content }` entries from `source` and turn them
   * into DAGs
   * It should yield a `function` that returns a `Promise` that resolves to
   * `{ cid, path, unixfs, node }` where `cid` is a `CID`, `path` is a string, `unixfs`
   * is a UnixFS entry and `node` is a `DAGNode`.
   * Values will be pulled from this generator in parallel - the amount of parallelisation
   * is controlled by the `fileImportConcurrency` option (default: 50)
   */
  dagBuilder?: DAGBuilder

  /**
   * This option can be used to override the importer internals.
   *
   * This function should read `{ cid, path, unixfs, node }` entries from `source` and
   * place them in a directory structure
   * It should yield an object with the properties `{ cid, path, unixfs, size }` where
   * `cid` is a `CID`, `path` is a string, `unixfs` is a UnixFS entry and `size` is a `Number`.
   */
  treeBuilder?: TreeBuilder

  /**
   * This option can be used to override the importer internals.
   *
   * This function should read `Buffer`s from `source` and persist them using `blockstore.put`
   * or similar
   * `entry` is the `{ path, content }` entry, where `entry.content` is an async
   * generator that yields Buffers
   * It should yield functions that return a Promise that resolves to an object with
   * the properties `{ cid, unixfs, size }` where `cid` is a [CID], `unixfs` is a [UnixFS] entry and `size` is a `Number` that represents the serialized size of the [IPLD] node that holds the buffer data.
   * Values will be pulled from this generator in parallel - the amount of
   * parallelisation is controlled by the `blockWriteConcurrency` option (default: 10)
   */
  bufferImporter?: BufferImporter

  /**
   * This option can be used to override the importer internals.
   *
   * This function takes input from the `content` field of imported entries.
   * It should transform them into `Buffer`s, throwing an error if it cannot.
   * It should yield `Buffer` objects constructed from the `source` or throw an
   * `Error`
   */
  chunkValidator?: ChunkValidator
}

export type ImportCandidateStream = AsyncIterable<FileCandidate | DirectoryCandidate> | Iterable<FileCandidate | DirectoryCandidate>

/**
 * The importer creates UnixFS DAGs and stores the blocks that make
 * them up in the passed blockstore.
 *
 * @example
 *
 * ```typescript
 * import { importer } from 'ipfs-unixfs-importer'
 * import { MemoryBlockstore } from 'blockstore-core'
 *
 * // store blocks in memory, other blockstores are available
 * const blockstore = new MemoryBlockstore()
 *
 * const input = [{
 *   path: './foo.txt',
 *   content: Uint8Array.from([0, 1, 2, 3, 4])
 * }, {
 *   path: './bar.txt',
 *   content: Uint8Array.from([0, 1, 2, 3, 4])
 * }]
 *
 * for await (const entry of importer(input, blockstore)) {
 *   console.info(entry)
 *   // { cid: CID(), ... }
 * }
 * ```
 */
export async function * importer (source: ImportCandidateStream, blockstore: WritableStorage, options: ImporterOptions = {}): AsyncGenerator<ImportResult, void, unknown> {
  let candidates: AsyncIterable<FileCandidate | DirectoryCandidate> | Iterable<FileCandidate | DirectoryCandidate>

  if (Symbol.asyncIterator in source || Symbol.iterator in source) {
    candidates = source
  } else {
    candidates = [source]
  }

  const wrapWithDirectory = options.wrapWithDirectory ?? false
  const shardSplitThresholdBytes = options.shardSplitThresholdBytes ?? 262144
  const cidVersion = options.cidVersion ?? 1
  const rawLeaves = options.rawLeaves ?? true
  const leafType = options.leafType ?? 'file'
  const fileImportConcurrency = options.fileImportConcurrency ?? 50
  const blockWriteConcurrency = options.blockWriteConcurrency ?? 10
  const reduceSingleLeafToSelf = options.reduceSingleLeafToSelf ?? true

  const chunker = options.chunker ?? fixedSize()
  const chunkValidator = options.chunkValidator ?? defaultChunkValidator()
  const buildDag: DAGBuilder = options.dagBuilder ?? defaultDagBuilder({
    chunker,
    chunkValidator,
    wrapWithDirectory,
    layout: options.layout ?? balanced(),
    bufferImporter: options.bufferImporter ?? defaultBufferImporter({
      cidVersion,
      rawLeaves,
      leafType,
      onProgress: options.onProgress
    }),
    blockWriteConcurrency,
    reduceSingleLeafToSelf,
    cidVersion,
    onProgress: options.onProgress
  })
  const buildTree: TreeBuilder = options.treeBuilder ?? defaultTreeBuilder({
    wrapWithDirectory,
    shardSplitThresholdBytes,
    cidVersion,
    onProgress: options.onProgress
  })

  for await (const entry of buildTree(parallelBatch(buildDag(candidates, blockstore), fileImportConcurrency), blockstore)) {
    yield {
      cid: entry.cid,
      path: entry.path,
      unixfs: entry.unixfs,
      size: entry.size
    }
  }
}

/**
 * `importFile` is similar to `importer` except it accepts a single
 * `FileCandidate` and returns a promise of a single `ImportResult`
 * instead of a stream of results.
 *
 * @example
 *
 * ```typescript
 * import { importFile } from 'ipfs-unixfs-importer'
 * import { MemoryBlockstore } from 'blockstore-core'
 *
 * // store blocks in memory, other blockstores are available
 * const blockstore = new MemoryBlockstore()
 *
 * const input: FileCandidate = {
 *   path: './foo.txt',
 *   content: Uint8Array.from([0, 1, 2, 3, 4])
 * }
 *
 * const entry = await importFile(input, blockstore)
 * ```
 */
export async function importFile (content: FileCandidate, blockstore: WritableStorage, options: ImporterOptions = {}): Promise<ImportResult> {
  const result = await first(importer([content], blockstore, options))

  if (result == null) {
    throw errcode(new Error('Nothing imported'), 'ERR_INVALID_PARAMS')
  }

  return result
}

/**
 * `importDir` is similar to `importer` except it accepts a single
 * `DirectoryCandidate` and returns a promise of a single `ImportResult`
 * instead of a stream of results.
 *
 * @example
 *
 * ```typescript
 * import { importDirectory } from 'ipfs-unixfs-importer'
 * import { MemoryBlockstore } from 'blockstore-core'
 *
 * // store blocks in memory, other blockstores are available
 * const blockstore = new MemoryBlockstore()
 *
 * const input: DirectoryCandidate = {
 *   path: './foo.txt'
 * }
 *
 * const entry = await importDirectory(input, blockstore)
 * ```
 */
export async function importDirectory (content: DirectoryCandidate, blockstore: WritableStorage, options: ImporterOptions = {}): Promise<ImportResult> {
  const result = await first(importer([content], blockstore, options))

  if (result == null) {
    throw errcode(new Error('Nothing imported'), 'ERR_INVALID_PARAMS')
  }

  return result
}

/**
 * `importBytes` accepts a single Uint8Array and returns a promise
 * of a single `ImportResult`.
 *
 * @example
 *
 * ```typescript
 * import { importBytes } from 'ipfs-unixfs-importer'
 * import { MemoryBlockstore } from 'blockstore-core'
 *
 * // store blocks in memory, other blockstores are available
 * const blockstore = new MemoryBlockstore()
 *
 * const input = Uint8Array.from([0, 1, 2, 3, 4])
 *
 * const entry = await importBytes(input, blockstore)
 * ```
 */
export async function importBytes (buf: ImportContent, blockstore: WritableStorage, options: ImporterOptions = {}): Promise<ImportResult> {
  return importFile({
    content: buf
  }, blockstore, options)
}

/**
 * `importByteStream` accepts a single stream of Uint8Arrays and
 * returns a promise of a single `ImportResult`.
 *
 * @example
 *
 * ```typescript
 * import { importByteStream } from 'ipfs-unixfs-importer'
 * import { MemoryBlockstore } from 'blockstore-core'
 *
 * // store blocks in memory, other blockstores are available
 * const blockstore = new MemoryBlockstore()
 *
 * const input = [
 *   Uint8Array.from([0, 1, 2, 3, 4]),
 *   Uint8Array.from([5, 6, 7, 8, 9])
 * ]
 *
 * const entry = await importByteStream(input, blockstore)
 * ```
 */
export async function importByteStream (bufs: ByteStream, blockstore: WritableStorage, options: ImporterOptions = {}): Promise<ImportResult> {
  return importFile({
    content: bufs
  }, blockstore, options)
}
