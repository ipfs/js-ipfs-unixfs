/**
 * @packageDocumentation
 *
 * This module contains the protobuf definition of the UnixFS data structure found at the root of all UnixFS DAGs.
 *
 * The UnixFS spec can be found in the [ipfs/specs repository](http://github.com/ipfs/specs)
 *
 * @example Create a file composed of several blocks
 *
 * ```JavaScript
 * const data = new UnixFS({ type: 'file' })
 * data.addBlockSize(256) // add the size of each block
 * data.addBlockSize(256)
 * // ...
 * ```
 *
 * @example Create a directory that contains several files
 *
 * Creating a directory that contains several files is achieve by creating a unixfs element that identifies a MerkleDAG node as a directory. The links of that MerkleDAG node are the files that are contained in this directory.
 *
 * ```JavaScript
 * const data = new UnixFS({ type: 'directory' })
 * ```
 *
 * @example Create an unixfs Data element
 *
 * ```JavaScript
 * const data = new UnixFS([options])
 * ```
 *
 * `options` is an optional object argument that might include the following keys:
 *
 * - type (string, default `file`): The type of UnixFS entry.  Can be:
 *   - `raw`
 *   - `directory`
 *   - `file`
 *   - `metadata`
 *   - `symlink`
 *   - `hamt-sharded-directory`
 * - data (Uint8Array): The optional data field for this node
 * - blockSizes (Array, default: `[]`): If this is a `file` node that is made up of multiple blocks, `blockSizes` is a list numbers that represent the size of the file chunks stored in each child node. It is used to calculate the total file size.
 * - mode (Number, default `0644` for files, `0755` for directories/hamt-sharded-directories) file mode
 * - mtime (`Date`, `{ secs, nsecs }`, `{ Seconds, FractionalNanoseconds }`, `[ secs, nsecs ]`): The modification time of this node
 *
 * @example Add and remove a block size to the block size list
 *
 * ```JavaScript
 * data.addBlockSize(<size in bytes>)
 * ```
 *
 * ```JavaScript
 * data.removeBlockSize(<index>)
 * ```
 *
 * @example Get total fileSize
 *
 * ```JavaScript
 * data.fileSize() // => size in bytes
 * ```
 *
 * @example Marshal and unmarshal
 *
 * ```javascript
 * const marshaled = data.marshal()
 * const unmarshaled = Unixfs.unmarshal(marshaled)
 * ```
 *
 * @example Is this UnixFS entry a directory?
 *
 * ```JavaScript
 * const dir = new Data({ type: 'directory' })
 * dir.isDirectory() // true
 *
 * const file = new Data({ type: 'file' })
 * file.isDirectory() // false
 * ```
 *
 * @example Has an mtime been set?
 *
 * If no modification time has been set, no `mtime` property will be present on the `Data` instance:
 *
 * ```JavaScript
 * const file = new Data({ type: 'file' })
 * file.mtime // undefined
 *
 * Object.prototype.hasOwnProperty.call(file, 'mtime') // false
 *
 * const dir = new Data({ type: 'dir', mtime: new Date() })
 * dir.mtime // { secs: Number, nsecs: Number }
 * ```
 */

import errcode from 'err-code'
import { Data as PBData } from './unixfs.js'

export interface Mtime {
  secs: bigint
  nsecs?: number
}

export type MtimeLike = Mtime | { Seconds: number, FractionalNanoseconds?: number } | [number, number] | Date

const types: Record<string, string> = {
  Raw: 'raw',
  Directory: 'directory',
  File: 'file',
  Metadata: 'metadata',
  Symlink: 'symlink',
  HAMTShard: 'hamt-sharded-directory'
}

const dirTypes = [
  'directory',
  'hamt-sharded-directory'
]

const DEFAULT_FILE_MODE = parseInt('0644', 8)
const DEFAULT_DIRECTORY_MODE = parseInt('0755', 8)

export interface UnixFSOptions {
  type?: string
  data?: Uint8Array
  blockSizes?: bigint[]
  hashType?: bigint
  fanout?: bigint
  mtime?: Mtime
  mode?: number
}

class UnixFS {
  /**
   * Decode from protobuf https://github.com/ipfs/specs/blob/master/UNIXFS.md
   */
  static unmarshal (marshaled: Uint8Array): UnixFS {
    const message = PBData.decode(marshaled)

    const data = new UnixFS({
      type: types[message.Type != null ? message.Type.toString() : 'File'],
      data: message.Data,
      blockSizes: message.blocksizes,
      mode: message.mode,
      mtime: message.mtime != null
        ? {
            secs: message.mtime.Seconds ?? 0n,
            nsecs: message.mtime.FractionalNanoseconds
          }
        : undefined,
      fanout: message.fanout
    })

    // make sure we honour the original mode
    data._originalMode = message.mode ?? 0

    return data
  }

  public type: string
  public data?: Uint8Array
  public blockSizes: bigint[]
  public hashType?: bigint
  public fanout?: bigint
  public mtime?: Mtime

  private _mode?: number
  private _originalMode: number

  constructor (options: UnixFSOptions = {
    type: 'file'
  }) {
    const {
      type,
      data,
      blockSizes,
      hashType,
      fanout,
      mtime,
      mode
    } = options

    if (type != null && !Object.values(types).includes(type)) {
      throw errcode(new Error('Type: ' + type + ' is not valid'), 'ERR_INVALID_TYPE')
    }

    this.type = type ?? 'file'
    this.data = data
    this.hashType = hashType
    this.fanout = fanout
    this.blockSizes = blockSizes ?? []
    this._originalMode = 0
    this.mode = mode
    this.mtime = mtime
  }

  set mode (mode: number | undefined) {
    if (mode == null) {
      this._mode = this.isDirectory() ? DEFAULT_DIRECTORY_MODE : DEFAULT_FILE_MODE
    } else {
      this._mode = (mode & 0xFFF)
    }
  }

  get mode (): number | undefined {
    return this._mode
  }

  isDirectory (): boolean {
    return dirTypes.includes(this.type)
  }

  addBlockSize (size: bigint): void {
    this.blockSizes.push(size)
  }

  removeBlockSize (index: number): void {
    this.blockSizes.splice(index, 1)
  }

  /**
   * Returns `0n` for directories or `data.length + sum(blockSizes)` for everything else
   */
  fileSize (): bigint {
    if (this.isDirectory()) {
      // dirs don't have file size
      return 0n
    }

    let sum = 0n
    this.blockSizes.forEach((size) => {
      sum += size
    })

    if (this.data != null) {
      sum += BigInt(this.data.length)
    }

    return sum
  }

  /**
   * encode to protobuf Uint8Array
   */
  marshal (): Uint8Array {
    let type

    switch (this.type) {
      case 'raw': type = PBData.DataType.Raw; break
      case 'directory': type = PBData.DataType.Directory; break
      case 'file': type = PBData.DataType.File; break
      case 'metadata': type = PBData.DataType.Metadata; break
      case 'symlink': type = PBData.DataType.Symlink; break
      case 'hamt-sharded-directory': type = PBData.DataType.HAMTShard; break
      default:
        throw errcode(new Error(`Type: ${type} is not valid`), 'ERR_INVALID_TYPE')
    }

    let data = this.data

    if (this.data == null || this.data.length === 0) {
      data = undefined
    }

    let mode

    if (this.mode != null) {
      mode = (this._originalMode & 0xFFFFF000) | (this.mode ?? 0)

      if (mode === DEFAULT_FILE_MODE && !this.isDirectory()) {
        mode = undefined
      }

      if (mode === DEFAULT_DIRECTORY_MODE && this.isDirectory()) {
        mode = undefined
      }
    }

    let mtime

    if (this.mtime != null) {
      mtime = {
        Seconds: this.mtime.secs,
        FractionalNanoseconds: this.mtime.nsecs
      }
    }

    return PBData.encode({
      Type: type,
      Data: data,
      filesize: this.isDirectory() ? undefined : this.fileSize(),
      blocksizes: this.blockSizes,
      hashType: this.hashType,
      fanout: this.fanout,
      mode,
      mtime
    })
  }
}

export { UnixFS }
