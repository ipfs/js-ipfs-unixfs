/**
 * @packageDocumentation
 *
 * The UnixFS Exporter provides a means to read DAGs from a blockstore given a CID.
 *
 * @example
 *
 * ```js
 * // import a file and export it again
 * import { importer } from 'ipfs-unixfs-importer'
 * import { exporter } from 'ipfs-unixfs-exporter'
 * import { MemoryBlockstore } from 'blockstore-core/memory'
 *
 * // Should contain the blocks we are trying to export
 * const blockstore = new MemoryBlockstore()
 * const files = []
 *
 * for await (const file of importer([{
 *   path: '/foo/bar.txt',
 *   content: new Uint8Array([0, 1, 2, 3])
 * }], blockstore)) {
 *   files.push(file)
 * }
 *
 * console.info(files[0].cid) // Qmbaz
 *
 * const entry = await exporter(files[0].cid, blockstore)
 *
 * console.info(entry.cid) // Qmqux
 * console.info(entry.path) // Qmbaz/foo/bar.txt
 * console.info(entry.name) // bar.txt
 * console.info(entry.unixfs.fileSize()) // 4
 *
 * // stream content from unixfs node
 * const size = entry.unixfs.fileSize()
 * const bytes = new Uint8Array(size)
 * let offset = 0
 *
 * for await (const buf of entry.content()) {
 *   bytes.set(buf, offset)
 *   offset += chunk.length
 * }
 *
 * console.info(bytes) // 0, 1, 2, 3
 * ```
 */

import errCode from 'err-code'
import last from 'it-last'
import { CID } from 'multiformats/cid'
import resolve from './resolvers/index.js'
import type { PBNode } from '@ipld/dag-pb'
import type { Bucket } from 'hamt-sharding'
import type { Blockstore } from 'interface-blockstore'
import type { UnixFS } from 'ipfs-unixfs'
import type { ProgressOptions, ProgressEvent } from 'progress-events'

export interface ExportProgress {
  /**
   * How many bytes of the file have been read
   */
  bytesRead: bigint

  /**
   * How many bytes of the file will be read - n.b. this may be
   * smaller than `fileSize` if `offset`/`length` have been
   * specified
   */
  totalBytes: bigint

  /**
   * The size of the file being read - n.b. this may be
   * larger than `total` if `offset`/`length` has been
   * specified
   */
  fileSize: bigint
}

export interface ExportWalk {
  cid: CID
}

/**
 * Progress events emitted by the exporter
 */
export type ExporterProgressEvents =
  ProgressEvent<'unixfs:exporter:progress:unixfs:file', ExportProgress> |
  ProgressEvent<'unixfs:exporter:progress:unixfs:raw', ExportProgress> |
  ProgressEvent<'unixfs:exporter:progress:raw', ExportProgress> |
  ProgressEvent<'unixfs:exporter:progress:identity', ExportProgress> |
  ProgressEvent<'unixfs:exporter:walk:file', ExportWalk> |
  ProgressEvent<'unixfs:exporter:walk:directory', ExportWalk> |
  ProgressEvent<'unixfs:exporter:walk:hamt-sharded-directory', ExportWalk> |
  ProgressEvent<'unixfs:exporter:walk:raw', ExportWalk>

export interface ExporterOptions extends ProgressOptions<ExporterProgressEvents> {
  /**
   * An optional offset to start reading at.
   *
   * If the CID resolves to a file this will be a byte offset within that file,
   * otherwise if it's a directory it will be a directory entry offset within
   * the directory listing. (default: undefined)
   */
  offset?: number

  /**
   * An optional length to read.
   *
   * If the CID resolves to a file this will be the number of bytes read from
   * the file, otherwise if it's a directory it will be the number of directory
   * entries read from the directory listing. (default: undefined)
   */
  length?: number

  /**
   * This signal can be used to abort any long-lived operations such as fetching
   * blocks from the network. (default: undefined)
   */
  signal?: AbortSignal

  /**
   * When a DAG layer is encountered, all child nodes are loaded in parallel but
   * processed as they arrive. This allows us to load sibling nodes in advance
   * of yielding their bytes. Pass a value here to control the number of blocks
   * loaded in parallel. If a strict depth-first traversal is required, this
   * value should be set to `1`, otherwise the traversal order will tend to
   * resemble a breadth-first fan-out and yield a have stable ordering.
   * (default: undefined)
   */
  blockReadConcurrency?: number
}

export interface Exportable<T> {
  /**
   * A disambiguator to allow TypeScript to work out the type of the entry.
   *
   * @example
   *
   * ```TypeScript
   * if (entry.type === 'file') {
   *   // access UnixFSFile properties safely
   * }
   *
   * if (entry.type === 'directory') {
   *   // access UnixFSDirectory properties safely
   * }
   * ```
   */
  type: 'file' | 'directory' | 'object' | 'raw' | 'identity'

  /**
   * The name of the entry
   */
  name: string

  /**
   * The path of the entry within the DAG in which it was encountered
   */
  path: string

  /**
   * The CID of the entry
   */
  cid: CID

  /**
   * How far down the DAG the entry is
   */
  depth: number

  /**
   * The size of the entry
   */
  size: bigint

  /**
   * @example File content
   *
   * When `entry` is a file or a `raw` node, `offset` and/or `length` arguments can be passed to `entry.content()` to return slices of data:
   *
   * ```javascript
   * const length = 5
   * const data = new Uint8Array(length)
   * let offset = 0
   *
   * for await (const chunk of entry.content({
   *   offset: 0,
   *   length
   * })) {
   *   data.set(chunk, offset)
   *   offset += chunk.length
   * }
   *
   * // `data` contains the first 5 bytes of the file
   * return data
   * ```
   *
   * @example Directory content
   *
   * If `entry` is a directory, passing `offset` and/or `length` to `entry.content()` will limit the number of files returned from the directory.
   *
   * ```javascript
   * const entries = []
   *
   * for await (const entry of dir.content({
   *   offset: 0,
   *   length: 5
   * })) {
   *   entries.push(entry)
   * }
   *
   * // `entries` contains the first 5 files/directories in the directory
   * ```
   */
  content(options?: ExporterOptions): AsyncGenerator<T, void, unknown>
}

/**
 * If the entry is a file, `entry.content()` returns an async iterator that yields one or more Uint8Arrays containing the file content:
 *
 * ```javascript
 * if (entry.type === 'file') {
 *   for await (const chunk of entry.content()) {
 *     // chunk is a Buffer
 *   }
 * }
 * ```
 */
export interface UnixFSFile extends Exportable<Uint8Array> {
  type: 'file'
  unixfs: UnixFS
  node: PBNode
}

/**
 * If the entry is a directory, `entry.content()` returns further `entry` objects:
 *
 * ```javascript
 * if (entry.type === 'directory') {
 *   for await (const entry of dir.content()) {
 *     console.info(entry.name)
 *   }
 * }
 * ```
 */
export interface UnixFSDirectory extends Exportable<UnixFSEntry> {
  type: 'directory'
  unixfs: UnixFS
  node: PBNode
}

/**
 * Entries with a `dag-cbor` or `dag-json` codec {@link CID} return JavaScript object entries
 */
export interface ObjectNode extends Exportable<any> {
  type: 'object'
  node: Uint8Array
}

/**
 * Entries with a `raw` codec {@link CID} return raw entries.
 *
 * `entry.content()` returns an async iterator that yields a buffer containing the node content:
 *
 * ```javascript
 * for await (const chunk of entry.content()) {
 *   // chunk is a Buffer
 * }
 * ```
 *
 * Unless you an options object containing `offset` and `length` keys as an argument to `entry.content()`, `chunk` will be equal to `entry.node`.
 */
export interface RawNode extends Exportable<Uint8Array> {
  type: 'raw'
  node: Uint8Array
}

/**
 * Entries with a `identity` codec {@link CID} return identity entries.
 *
 * These are entries where the data payload is stored in the CID itself,
 * otherwise they are identical to {@link RawNode}s.
 */
export interface IdentityNode extends Exportable<Uint8Array> {
  type: 'identity'
  node: Uint8Array
}

/**
 * A UnixFSEntry is a representation of the types of node that can be
 * encountered in a DAG.
 */
export type UnixFSEntry = UnixFSFile | UnixFSDirectory | ObjectNode | RawNode | IdentityNode

export interface NextResult {
  cid: CID
  name: string
  path: string
  toResolve: string[]
}

export interface ResolveResult {
  entry: UnixFSEntry
  next?: NextResult
}

export interface Resolve { (cid: CID, name: string, path: string, toResolve: string[], depth: number, blockstore: ReadableStorage, options: ExporterOptions): Promise<ResolveResult> }
export interface Resolver { (cid: CID, name: string, path: string, toResolve: string[], resolve: Resolve, depth: number, blockstore: ReadableStorage, options: ExporterOptions): Promise<ResolveResult> }

export type UnixfsV1FileContent = AsyncIterable<Uint8Array> | Iterable<Uint8Array>
export type UnixfsV1DirectoryContent = AsyncIterable<UnixFSEntry> | Iterable<UnixFSEntry>
export type UnixfsV1Content = UnixfsV1FileContent | UnixfsV1DirectoryContent
export interface UnixfsV1Resolver { (cid: CID, node: PBNode, unixfs: UnixFS, path: string, resolve: Resolve, depth: number, blockstore: ReadableStorage): (options: ExporterOptions) => UnixfsV1Content }

export interface ShardTraversalContext {
  hamtDepth: number
  rootBucket: Bucket<boolean>
  lastBucket: Bucket<boolean>
}

/**
 * A subset of the {@link Blockstore} interface that just contains the get
 * method.
 */
export type ReadableStorage = Pick<Blockstore, 'get'>

const toPathComponents = (path: string = ''): string[] => {
  // split on / unless escaped with \
  return (path
    .trim()
    .match(/([^\\^/]|\\\/)+/g) ?? [])
    .filter(Boolean)
}

const cidAndRest = (path: string | Uint8Array | CID): { cid: CID, toResolve: string[] } => {
  if (path instanceof Uint8Array) {
    return {
      cid: CID.decode(path),
      toResolve: []
    }
  }

  const cid = CID.asCID(path)
  if (cid != null) {
    return {
      cid,
      toResolve: []
    }
  }

  if (typeof path === 'string') {
    if (path.indexOf('/ipfs/') === 0) {
      path = path.substring(6)
    }

    const output = toPathComponents(path)

    return {
      cid: CID.parse(output[0]),
      toResolve: output.slice(1)
    }
  }

  throw errCode(new Error(`Unknown path type ${path}`), 'ERR_BAD_PATH')
}

/**
 * Returns an async iterator that yields entries for all segments in a path
 *
 * @example
 *
 * ```javascript
 * import { walkPath } from 'ipfs-unixfs-exporter'
 *
 * const entries = []
 *
 * for await (const entry of walkPath('Qmfoo/foo/bar/baz.txt', blockstore)) {
 *   entries.push(entry)
 * }
 *
 * // entries contains 4x `entry` objects
 * ```
 */
export async function * walkPath (path: string | CID, blockstore: ReadableStorage, options: ExporterOptions = {}): AsyncGenerator<UnixFSEntry, void, any> {
  let {
    cid,
    toResolve
  } = cidAndRest(path)
  let name = cid.toString()
  let entryPath = name
  const startingDepth = toResolve.length

  while (true) {
    const result = await resolve(cid, name, entryPath, toResolve, startingDepth, blockstore, options)

    if (result.entry == null && result.next == null) {
      throw errCode(new Error(`Could not resolve ${path}`), 'ERR_NOT_FOUND')
    }

    if (result.entry != null) {
      yield result.entry
    }

    if (result.next == null) {
      return
    }

    // resolve further parts
    toResolve = result.next.toResolve
    cid = result.next.cid
    name = result.next.name
    entryPath = result.next.path
  }
}

/**
 * Uses the given blockstore instance to fetch an IPFS node by a CID or path.
 *
 * Returns a {@link Promise} which resolves to a {@link UnixFSEntry}.
 *
 * @example
 *
 * ```typescript
 * import { exporter } from 'ipfs-unixfs-exporter'
 * import { CID } from 'multiformats/cid'
 *
 * const cid = CID.parse('QmFoo')
 *
 * const entry = await exporter(cid, blockstore, {
 *   signal: AbortSignal.timeout(50000)
 * })
 *
 * if (entry.type === 'file') {
 *   for await (const chunk of entry.content()) {
 *     // chunk is a Uint8Array
 *   }
 * }
 * ```
 */
export async function exporter (path: string | CID, blockstore: ReadableStorage, options: ExporterOptions = {}): Promise<UnixFSEntry> {
  const result = await last(walkPath(path, blockstore, options))

  if (result == null) {
    throw errCode(new Error(`Could not resolve ${path}`), 'ERR_NOT_FOUND')
  }

  return result
}

/**
 * Returns an async iterator that yields all entries beneath a given CID or IPFS
 * path, as well as the containing directory.
 *
 * @example
 *
 * ```typescript
 * import { recursive } from 'ipfs-unixfs-exporter'
 *
 * const entries = []
 *
 * for await (const child of recursive('Qmfoo/foo/bar', blockstore)) {
 *   entries.push(entry)
 * }
 *
 * // entries contains all children of the `Qmfoo/foo/bar` directory and it's children
 * ```
 */
export async function * recursive (path: string | CID, blockstore: ReadableStorage, options: ExporterOptions = {}): AsyncGenerator<UnixFSEntry, void, any> {
  const node = await exporter(path, blockstore, options)

  if (node == null) {
    return
  }

  yield node

  if (node.type === 'directory') {
    for await (const child of recurse(node, options)) {
      yield child
    }
  }

  async function * recurse (node: UnixFSDirectory, options: ExporterOptions): AsyncGenerator<UnixFSEntry, void, any> {
    for await (const file of node.content(options)) {
      yield file

      if (file instanceof Uint8Array) {
        continue
      }

      if (file.type === 'directory') {
        yield * recurse(file, options)
      }
    }
  }
}
