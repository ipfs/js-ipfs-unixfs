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
