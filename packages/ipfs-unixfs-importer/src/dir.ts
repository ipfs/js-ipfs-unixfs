import type { Blockstore } from 'interface-blockstore'
import type { Mtime, UnixFS } from 'ipfs-unixfs'
import { CID } from 'multiformats/cid'
import type { ImporterOptions, ImportResult, InProgressImportResult } from './index.js'

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

export class Dir {
  public options: ImporterOptions
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

  constructor (props: DirProps, options: ImporterOptions) {
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

  async put (name: string, value: InProgressImportResult | Dir): Promise<void> { }

  async get (name: string): Promise<InProgressImportResult | Dir | undefined> {
    return await Promise.resolve(this)
  }

  async * eachChildSeries (): AsyncIterable<{ key: string, child: InProgressImportResult | Dir }> { }

  async * flush (blockstore: Blockstore): AsyncGenerator<ImportResult> { }

  estimateNodeSize (): number {
    return 0
  }
}

// we use these to calculate the node size to use as a check for whether a directory
// should be sharded or not. Since CIDs have a constant length and We're only
// interested in the data length and not the actual content identifier we can use
// any old CID instead of having to hash the data which is expensive.
export const CID_V0 = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
export const CID_V1 = CID.parse('zdj7WbTaiJT1fgatdet9Ei9iDB5hdCxkbVyhyh8YTUnXMiwYi')
