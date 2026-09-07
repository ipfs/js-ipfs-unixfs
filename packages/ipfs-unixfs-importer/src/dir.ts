import { CID } from 'multiformats/cid'
import type { WritableStorage, ImportResult, InProgressImportResult } from './index.ts'
import type { AddToTreeOptions } from './tree-builder.ts'
import type { Blockstore } from 'interface-blockstore'
import type { Mtime, UnixFS } from 'ipfs-unixfs'

export interface DirProps {
  root: boolean
  dir: boolean
  path: string
  dirty: boolean
  flat: boolean
  parent?: Dir
  parentKey?: string
  unixfs?: UnixFS
  mode?: number
  mtime?: Mtime
}

export abstract class Dir {
  public options: AddToTreeOptions
  public root: boolean
  public dir: boolean
  public path: string
  public dirty: boolean
  public flat: boolean
  public parent?: Dir
  public parentKey?: string
  public unixfs?: UnixFS
  public mode?: number
  public mtime?: Mtime
  public cid?: CID
  public size?: number
  public nodeSize?: number

  constructor (props: DirProps, options: AddToTreeOptions) {
    this.options = options ?? {}

    this.root = props.root
    this.dir = props.dir
    this.path = props.path
    this.dirty = props.dirty
    this.flat = props.flat
    this.parent = props.parent
    this.parentKey = props.parentKey
    this.unixfs = props.unixfs
    this.mode = props.mode
    this.mtime = props.mtime
  }

  abstract put (name: string, value: InProgressImportResult | Dir): Promise<void>
  abstract get (name: string): Promise<InProgressImportResult | Dir | undefined>
  abstract eachChildSeries (): Iterable<{ key: string, child: InProgressImportResult | Dir }>
  abstract flush (blockstore: WritableStorage): AsyncGenerator<ImportResult>
  abstract estimateNodeSize (blockstore: Blockstore): Promise<number>
  abstract childCount (): number
}
