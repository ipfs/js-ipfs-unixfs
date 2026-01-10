/**
 * @packageDocumentation
 *
 * The UnixFS Exporter provides a means to read DAGs from a blockstore given a
 * CID.
 *
 * @example
 *
 * ```TypeScript
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
 * if (entry.type !== 'file') {
 *   throw new Error('Unexpected entry type')
 * }
 *
 * console.info(entry.cid) // Qmqux
 * console.info(entry.unixfs.fileSize()) // 4
 *
 * // stream content from unixfs node
 * const size = entry.unixfs.fileSize()
 * const bytes = new Uint8Array(Number(size))
 * let offset = 0
 *
 * for await (const buf of entry.content()) {
 *   bytes.set(buf, offset)
 *   offset += buf.byteLength
 * }
 *
 * console.info(bytes) // 0, 1, 2, 3
 * ```
 */

import { CID } from 'multiformats/cid'
import { resolve } from './exporters/index.js'
import type { PBNode } from '@ipld/dag-pb'
import type { Blockstore } from 'interface-blockstore'
import type { UnixFS } from 'ipfs-unixfs'
import type { ProgressOptions, ProgressEvent } from 'progress-events'

export * from './errors.js'
export * from './walk-path/index.js'

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
   * the directory listing.
   *
   * @default undefined
   */
  offset?: number

  /**
   * An optional length to read.
   *
   * If the CID resolves to a file this will be the number of bytes read from
   * the file, otherwise if it's a directory it will be the number of directory
   * entries read from the directory listing.
   *
   * @default undefined
   */
  length?: number

  /**
   * This signal can be used to abort any long-lived operations such as fetching
   * blocks from the network.
   *
   * @default undefined
   */
  signal?: AbortSignal

  /**
   * When a DAG layer is encountered, all child nodes are loaded in parallel but
   * processed as they arrive. This allows us to load sibling nodes in advance
   * of yielding their bytes. Pass a value here to control the number of blocks
   * loaded in parallel. If a strict depth-first traversal is required, this
   * value should be set to `1`, otherwise the traversal order will tend to
   * resemble a breadth-first fan-out with stable ordering.
   *
   * @default undefined
   */
  blockReadConcurrency?: number
}

export interface WalkPathOptions extends ProgressOptions<ExporterProgressEvents> {
  /**
   * This signal can be used to abort any long-lived operations such as fetching
   * blocks from the network.
   *
   * @default undefined
   */
  signal?: AbortSignal

  /**
   * By default if a HAMT-sharded directory is encountered, only file and
   * directory entries are yielded. Pass `true` here to also yield intermediate
   * sub-shards.
   *
   * @default false
   */
  yieldSubShards?: boolean

  /**
   * If a HAMT-sharded directory is encountered, paths will be translated
   * automatically, e.g. `QmHamt/bar.txt` -> `QmHamt/F0/A1bar.txt`, pass `false`
   * here to not perform this translation.
   *
   * @default true
   */
  translateHamtPath?: boolean

  /**
   * Passed to the underlying block store - may prevent network operations if
   * set to `true`.
   *
   * @default false
   */
  offline?: boolean
}

export interface Exportable {
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
   * The CID of the entry
   */
  cid: CID
}

/**
 * If the entry is a file, `entry.content()` returns an async iterator that yields one or more Uint8Arrays containing the file content:
 *
 * ```TypeScript
 * if (entry.type === 'file') {
 *   for await (const chunk of entry.content()) {
 *     // chunk is a Buffer
 *   }
 * }
 * ```
 */
export interface UnixFSFile extends Exportable {
  type: 'file'
  unixfs: UnixFS
  node: PBNode

  /**
   * The size of the entry
   */
  size: bigint

  /**
   * `offset` and/or `length` arguments can be passed to `entry.content()` to
   * return slices of data:
   *
   * ```TypeScript
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
   */
  content(options?: ExporterOptions): AsyncGenerator<Uint8Array, void, unknown>
}

export interface UnixFSDirectoryEntry {
  cid: CID
  name: string
}

/**
 * If the entry is a directory, `entry.entries()` returns further `entry` objects:
 *
 * ```TypeScript
 * if (entry.type === 'directory') {
 *   for await (const entry of dir.content()) {
 *     console.info(entry.name)
 *   }
 * }
 * ```
 */
export interface UnixFSDirectory extends Exportable {
  type: 'directory'
  unixfs: UnixFS
  node: PBNode

  /**
   * Passing `offset` and/or `length` to `entry.content()` will limit the number
   * of files returned from the directory.
   *
   * ```TypeScript
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
  entries(options?: ExporterOptions): AsyncGenerator<UnixFSDirectoryEntry, void, unknown>
}

/**
 * Entries with a `dag-cbor`, `dag-json`, `cbor` or `json` codec {@link CID}
 * return JavaScript object entries
 */
export interface ObjectNode<T = any> extends Exportable {
  type: 'object'
  object: T
  node: Uint8Array
}

/**
 * Entries with a `raw` codec {@link CID} return raw entries.
 *
 * `entry.content()` returns an async iterator that yields a buffer containing the node content:
 *
 * ```TypeScript
 * for await (const chunk of entry.content()) {
 *   // chunk is a Buffer
 * }
 * ```
 *
 * Unless you an options object containing `offset` and `length` keys as an argument to `entry.content()`, `chunk` will be equal to `entry.node`.
 */
export interface RawNode extends Exportable {
  type: 'raw'
  node: Uint8Array
  size: bigint
  content(options?: ExporterOptions): AsyncGenerator<Uint8Array, void, unknown>
}

/**
 * Entries with a `identity` codec {@link CID} return identity entries.
 *
 * These are entries where the data payload is stored in the CID itself,
 * otherwise they are identical to {@link RawNode}s.
 */
export interface IdentityNode extends Exportable {
  type: 'identity'
  node: Uint8Array
  size: bigint
  content(options?: ExporterOptions): AsyncGenerator<Uint8Array, void, unknown>
}

/**
 * A UnixFSEntry is a representation of the types of node that can be
 * encountered in a DAG.
 */
export type UnixFSEntry = UnixFSFile | UnixFSDirectory | ObjectNode | RawNode | IdentityNode

export interface Resolver {
  (cid: CID, blockstore: ReadableStorage, options: ExporterOptions): Promise<UnixFSEntry>
}

export type UnixfsV1FileContent = AsyncIterable<Uint8Array> | Iterable<Uint8Array>
export type UnixfsV1DirectoryContent = AsyncIterable<UnixFSEntry> | Iterable<UnixFSEntry>
export type UnixfsV1Content = UnixfsV1FileContent | UnixfsV1DirectoryContent

/**
 * A subset of the {@link Blockstore} interface that just contains the get
 * method.
 */
export type ReadableStorage = Pick<Blockstore, 'get'>

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
export async function exporter (cid: CID, blockstore: ReadableStorage, options: ExporterOptions = {}): Promise<UnixFSEntry> {
  return resolve(cid, blockstore, options)
}

export interface UnixFSRecursiveEntry extends UnixFSDirectoryEntry {
  path: string
  depth: number
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
 * for await (const child of recursive(CID.parse('Qmfoo'), blockstore)) {
 *   entries.push(entry)
 * }
 *
 * // entries contains all children of the `Qmfoo` directory and it's children
 * ```
 */
export async function * recursive (path: CID, blockstore: ReadableStorage, options: ExporterOptions = {}): AsyncGenerator<UnixFSRecursiveEntry, void, any> {
  yield {
    cid: path,
    name: path.toString(),
    depth: 0,
    path: path.toString()
  }

  const node = await exporter(path, blockstore, options)

  if (node == null) {
    return
  }

  if (node.type === 'directory') {
    for await (const child of recurse(node, 0, `${path}`, options)) {
      yield child
    }
  }

  async function * recurse (node: UnixFSDirectory, depth: number, path: string, options: ExporterOptions): AsyncGenerator<UnixFSRecursiveEntry, void, any> {
    depth++

    for await (const entry of node.entries(options)) {
      const entryPath = `${path}/${entry.name}`

      yield {
        ...entry,
        depth,
        path: entryPath
      }

      const file = await exporter(entry.cid, blockstore, options)

      if (file.type === 'directory') {
        yield * recurse(file, depth, entryPath, options)
      }
    }
  }
}
