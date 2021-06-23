import { UnixFS, Mtime } from 'ipfs-unixfs'
import { CID, CIDVersion } from 'multiformats/cid'
import { MultihashHasher } from 'multiformats/hashes/interface'
import { BlockCodec } from 'multiformats/codecs/interface'
import { Blockstore } from 'interface-blockstore'

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
type DAGBuilder = (source: AsyncIterable<ImportCandidate> | Iterable<ImportCandidate>, blockstore: Blockstore, options: ImporterOptions) => AsyncIterable<() => Promise<InProgressImportResult>>
type TreeBuilder = (source: AsyncIterable<InProgressImportResult>, blockstore: Blockstore, options: ImporterOptions) => AsyncIterable<ImportResult>
type BufferImporter = (file: File, blockstore: Blockstore, options: ImporterOptions) => AsyncIterable<() => Promise<InProgressImportResult>>
type ChunkValidator = (source: AsyncIterable<Uint8Array>, options: ImporterOptions) => AsyncIterable<Uint8Array>
type UnixFSV1DagBuilder<T> = (item: T, blockstore: Blockstore, options: ImporterOptions) => Promise<InProgressImportResult>
type Reducer = (leaves: InProgressImportResult[]) => Promise<InProgressImportResult>

type FileDAGBuilder = (source: AsyncIterable<InProgressImportResult> | Iterable<InProgressImportResult>, reducer: Reducer, options: ImporterOptions) => Promise<InProgressImportResult>

interface UserImporterOptions {
  strategy?: 'balanced' | 'flat' | 'trickle'
  rawLeaves?: boolean
  onlyHash?: boolean
  reduceSingleLeafToSelf?: boolean
  hasher?: MultihashHasher
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
  hasher: MultihashHasher
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
  codec?: BlockCodec<any, any>
  hasher: MultihashHasher
  cidVersion: CIDVersion
  onlyHash: boolean
  signal?: AbortSignal
}
