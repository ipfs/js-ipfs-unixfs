import { UnixFS, Mtime } from 'ipfs-unixfs'
import CID, { CIDVersion } from 'cids'
import { HashName } from 'multihashes'
import Block from 'ipld-block'
import { CodecName } from 'multicodec'

interface ImportCandidate {
  path?: string
  content?: AsyncIterable<Uint8Array>
  mtime?: Mtime
  mode?: number
}

interface File {
  content: AsyncIterable<Uint8Array>
  path?: string
  mtime?: Mtime
  mode?: number
}

interface Directory {
  path?: string
  mtime?: Mtime
  mode?: number
}

interface ImportResult {
  cid: CID
  size: number
  path?: string
  unixfs?: UnixFS
}

interface InProgressImportResult extends ImportResult {
  single?: boolean
}

type ChunkerType = 'fixed' | 'rabin'
type ProgressHandler = (chunkSize: number, path?: string) => void
type HamtHashFn = (value: Uint8Array) => Promise<Uint8Array>
type Chunker = (source: AsyncIterable<Uint8Array>, options: ImporterOptions) => AsyncIterable<Uint8Array>
type DAGBuilder = (source: AsyncIterable<ImportCandidate> | Iterable<ImportCandidate>, block: BlockAPI, options: ImporterOptions) => AsyncIterable<() => Promise<InProgressImportResult>>
type TreeBuilder = (source: AsyncIterable<InProgressImportResult>, block: BlockAPI, options: ImporterOptions) => AsyncIterable<ImportResult>
type BufferImporter = (file: File, block: BlockAPI, options: ImporterOptions) => AsyncIterable<() => Promise<InProgressImportResult>>
type ChunkValidator = (source: AsyncIterable<Uint8Array>, options: ImporterOptions) => AsyncIterable<Uint8Array>
type UnixFSV1DagBuilder<T> = (item: T, block: BlockAPI, options: ImporterOptions) => Promise<InProgressImportResult>
type Reducer = (leaves: InProgressImportResult[]) => Promise<InProgressImportResult>

type FileDAGBuilder = (source: AsyncIterable<InProgressImportResult> | Iterable<InProgressImportResult>, reducer: Reducer, options: ImporterOptions) => Promise<InProgressImportResult>

interface UserImporterOptions {
  strategy?: 'balanced' | 'flat' | 'trickle'
  rawLeaves?: boolean
  onlyHash?: boolean
  reduceSingleLeafToSelf?: boolean
  hashAlg?: HashName
  leafType?: 'file' | 'raw'
  cidVersion?: CIDVersion
  progress?: ProgressHandler
  shardSplitThreshold?: number
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
  pin?: boolean
  recursive?: boolean
  hidden?: boolean
  preload?: boolean
  timeout?: number
  hamtHashFn?: HamtHashFn
  hamtBucketBits?: number
  hamtHashCode?: number
  chunker?: ChunkerType | Chunker
  dagBuilder?: DAGBuilder
  treeBuilder?: TreeBuilder
  bufferImporter?: BufferImporter
  chunkValidator?: ChunkValidator
}

interface ImporterOptions {
  strategy: 'balanced' | 'flat' | 'trickle'
  rawLeaves: boolean
  onlyHash: boolean
  reduceSingleLeafToSelf: boolean
  hashAlg: HashName
  leafType: 'file' | 'raw'
  cidVersion: CIDVersion
  progress: ProgressHandler
  shardSplitThreshold: number
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
  pin: boolean
  recursive: boolean
  hidden: boolean
  preload: boolean
  timeout?: number
  hamtHashFn: HamtHashFn
  hamtBucketBits: number
  hamtHashCode: number
  chunker: ChunkerType | Chunker
  dagBuilder?: DAGBuilder
  treeBuilder?: TreeBuilder
  bufferImporter?: BufferImporter
  chunkValidator?: ChunkValidator
}

export interface TrickleDagNode {
  children: InProgressImportResult[],
  depth: number,
  maxDepth: number,
  maxChildren: number,
  data?: InProgressImportResult[],
  parent?: TrickleDagNode
  cid?: CID,
  size?: number,
  unixfs?: UnixFS
}

export interface PersistOptions {
  codec?: string
  cidVersion: CIDVersion
  hashAlg: HashName
  onlyHash: boolean
  preload?: boolean
  timeout?: number
  signal?: AbortSignal
}

// TODO: remove this and get from core-ipfs-types
export interface BlockAPI {
  get: (cid: CID | string | Uint8Array, options?: BlockOptions) => Promise<Block>
  put: (block: Block | Uint8Array, options?: PutOptions) => Promise<Block>
}

// TODO: remove this and get from core-ipfs-types
export interface BlockOptions {
  signal?: AbortSignal
  timeout?: number
  preload?: boolean
}

// TODO: remove this and get from core-ipfs-types
export interface PutOptions extends BlockOptions {
  cid?: CID
  format?: CodecName
  mhtype?: HashName
  version?: CIDVersion
  pin?: boolean
}
