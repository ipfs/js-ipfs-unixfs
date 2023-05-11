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
  offset?: number
  length?: number
  signal?: AbortSignal
}

export interface Exportable<T> {
  type: 'file' | 'directory' | 'object' | 'raw' | 'identity'
  name: string
  path: string
  cid: CID
  depth: number
  size: bigint
  content: (options?: ExporterOptions) => AsyncGenerator<T, void, unknown>
}

export interface UnixFSFile extends Exportable<Uint8Array> {
  type: 'file'
  unixfs: UnixFS
  node: PBNode
}

export interface UnixFSDirectory extends Exportable<UnixFSEntry> {
  type: 'directory'
  unixfs: UnixFS
  node: PBNode
}

export interface ObjectNode extends Exportable<any> {
  type: 'object'
  node: Uint8Array
}

export interface RawNode extends Exportable<Uint8Array> {
  type: 'raw'
  node: Uint8Array
}

export interface IdentityNode extends Exportable<Uint8Array> {
  type: 'identity'
  node: Uint8Array
}

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

export async function exporter (path: string | CID, blockstore: ReadableStorage, options: ExporterOptions = {}): Promise<UnixFSEntry> {
  const result = await last(walkPath(path, blockstore, options))

  if (result == null) {
    throw errCode(new Error(`Could not resolve ${path}`), 'ERR_NOT_FOUND')
  }

  return result
}

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
