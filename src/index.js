'use strict'

const protons = require('protons')
const pb = protons(require('./unixfs.proto'))
const unixfsData = pb.Data

const types = [
  'raw',
  'directory',
  'file',
  'metadata',
  'symlink',
  'hamt-sharded-directory'
]

const dirTypes = [
  'directory',
  'hamt-sharded-directory'
]

const DEFAULT_FILE_MODE = parseInt('0644', 8)
const DEFAULT_DIRECTORY_MODE = parseInt('0755', 8)

function parseArgs (args) {
  if (args.length === 0) {
    return {
      type: 'file'
    }
  }

  if (args.length === 2) {
    // support old-style constructor
    return {
      type: args[0],
      data: args[1]
    }
  }

  if (typeof args[0] === 'string' || args[0] instanceof String) {
    return {
      type: args[0]
    }
  }

  return args[0]
}

class Data {
  // decode from protobuf https://github.com/ipfs/specs/blob/master/UNIXFS.md
  static unmarshal (marshaled) {
    const decoded = unixfsData.decode(marshaled)

    return new Data({
      type: types[decoded.Type],
      data: decoded.hasData() ? decoded.Data : undefined,
      blockSizes: decoded.blocksizes,
      mode: decoded.hasMode() ? decoded.mode : undefined,
      mtime: decoded.hasMtime() ? new Date(decoded.mtime * 1000) : undefined
    })
  }

  constructor (...args) {
    const {
      type,
      data,
      blockSizes,
      hashType,
      fanout,
      mtime,
      mode
    } = parseArgs(args)

    if (!types.includes(type)) {
      throw new Error('Type: ' + type + ' is not valid')
    }

    this.type = type
    this.data = data
    this.hashType = hashType
    this.fanout = fanout
    this.blockSizes = blockSizes || []
    this.mtime = mtime || new Date(0)
    this.mode = mode || mode === 0 ? (mode & 0xFFF) : undefined
    this._originalMode = mode

    if (this.mode === undefined && type === 'file') {
      this.mode = DEFAULT_FILE_MODE
    }

    if (this.mode === undefined && this.isDirectory()) {
      this.mode = DEFAULT_DIRECTORY_MODE
    }
  }

  isDirectory () {
    return dirTypes.includes(this.type)
  }

  addBlockSize (size) {
    this.blockSizes.push(size)
  }

  removeBlockSize (index) {
    this.blockSizes.splice(index, 1)
  }

  // data.length + blockSizes
  fileSize () {
    if (this.isDirectory()) {
      // dirs don't have file size
      return undefined
    }

    let sum = 0
    this.blockSizes.forEach((size) => {
      sum += size
    })

    if (this.data) {
      sum += this.data.length
    }

    return sum
  }

  // encode to protobuf
  marshal () {
    let type

    switch (this.type) {
      case 'raw': type = unixfsData.DataType.Raw; break
      case 'directory': type = unixfsData.DataType.Directory; break
      case 'file': type = unixfsData.DataType.File; break
      case 'metadata': type = unixfsData.DataType.Metadata; break
      case 'symlink': type = unixfsData.DataType.Symlink; break
      case 'hamt-sharded-directory': type = unixfsData.DataType.HAMTShard; break
      default:
        throw new Error(`Unkown type: "${this.type}"`)
    }

    let data = this.data

    if (!this.data || !this.data.length) {
      data = undefined
    }

    let blockSizes = this.blockSizes

    if (!this.blockSizes || !this.blockSizes.length) {
      blockSizes = undefined
    }

    let mode

    if (this.mode || this.mode === 0) {
      mode = (this._originalMode & 0xFFFFF000) | (this.mode & 0xFFF)

      if (mode === DEFAULT_FILE_MODE && this.type === 'file') {
        mode = undefined
      }

      if (mode === DEFAULT_DIRECTORY_MODE && this.isDirectory()) {
        mode = undefined
      }
    }

    let mtime

    if (this.mtime) {
      mtime = Math.round(this.mtime.getTime() / 1000)

      if (mtime === 0) {
        mtime = undefined
      }
    }

    return unixfsData.encode({
      Type: type,
      Data: data,
      filesize: this.fileSize(),
      blocksizes: blockSizes,
      hashType: this.hashType,
      fanout: this.fanout,
      mode,
      mtime
    })
  }
}

module.exports = Data
