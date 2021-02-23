import CID from 'cids'
import UnixFS from 'ipfs-unixfs'
import DAGNode from 'ipld-dag-pb'

interface ExporterOptions {
  offset?: number
  length?: number
  signal?: AbortSignal
  timeout?: number
}

interface Exportable<T> {
  type: 'file' | 'directory' | 'object' | 'raw' | 'identity',
  name: string
  path: string
  cid: CID
  depth: number
  size: number
  content: (options?: ExporterOptions) => AsyncIterable<T>
}

interface UnixFSFile extends Exportable<Uint8Array> {
  type: 'file'
  unixfs: UnixFS
  node: DAGNode
}

interface UnixFSDirectory extends Exportable<UnixFSEntry> {
  type: 'directory'
  unixfs: UnixFS
  node: DAGNode
}

interface ObjectNode extends Exportable<any> {
  type: 'object'
  node: Uint8Array
}

interface RawNode extends Exportable<Uint8Array> {
  type: 'raw'
  node: Uint8Array
}

interface IdentityNode extends Exportable<Uint8Array> {
  type: 'identity'
  node: Uint8Array
}

type UnixFSEntry = UnixFSFile | UnixFSDirectory | ObjectNode | RawNode | IdentityNode

interface NextResult {
  cid: CID
  name: string
  path: string
  toResolve: string[]
}

interface ResolveResult {
  entry: UnixFSEntry
  next?: NextResult
}

type Resolve = (cid: CID, name: string, path: string, toResolve: string[], depth: number, ipld: IPLD, options: ExporterOptions) => Promise<ResolveResult>
type Resolver = (cid: CID, name: string, path: string, toResolve: string[], resolve: Resolve, depth: number, ipld: IPLD, options: ExporterOptions) => Promise<ResolveResult>

type UnixfsV1FileContent = AsyncIterable<Uint8Array> | Iterable<Uint8Array>
type UnixfsV1DirectoryContent = AsyncIterable<UnixFSEntry> | Iterable<UnixFSEntry>
type UnixfsV1Content = UnixfsV1FileContent | UnixfsV1DirectoryContent
type UnixfsV1Resolver = (cid: CID, node: DAGNode, unixfs: UnixFS, path: string, resolve: Resolve, depth: number, ipld: IPLD) => (options: ExporterOptions) => UnixfsV1Content
