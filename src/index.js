'use strict'

const protons = require('protons')
const pb = protons(require('./unixfs.proto'))
// encode/decode
const unixfsData = pb.Data
// const unixfsMetadata = pb.MetaData // encode/decode

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

function Data (arg1, arg2) {
  if (!(this instanceof Data)) {
    return new Data(arg1, arg2)
  }

  if (arg1 == null) {
    arg1 = {
      type: 'file'
    }
  }

  let { type, data, blockSizes, mtime, mode } = arg1

  if (typeof arg1 === 'string' || arg1 instanceof String) {
    // support old-style constructor
    type = arg1
    data = arg2
  }

  if (types.indexOf(type) === -1) {
    throw new Error('Type: ' + type + ' is not valid')
  }

  this.type = type
  this.data = data
  this.blockSizes = blockSizes || []

  this.mtime = mtime || new Date(0)
  this.mode = mode

  if (this.mode === undefined && type === 'file') {
    this.mode = DEFAULT_FILE_MODE
  }

  if (this.mode === undefined && type.includes('directory')) {
    this.mode = DEFAULT_DIRECTORY_MODE
  }

  this.addBlockSize = (size) => {
    this.blockSizes.push(size)
  }

  this.removeBlockSize = (index) => {
    this.blockSizes.splice(index, 1)
  }

  // data.length + blockSizes
  this.fileSize = () => {
    if (dirTypes.indexOf(this.type) >= 0) {
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
  this.marshal = () => {
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

    if (!isNaN(this.mode)) {
      mode = this.mode

      if (mode === DEFAULT_FILE_MODE && this.type === 'file') {
        mode = undefined
      }

      if (mode === DEFAULT_DIRECTORY_MODE && this.type.includes('directory')) {
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
      mode: mode,
      mtime: mtime
    })
  }
}

// decode from protobuf https://github.com/ipfs/go-ipfs/blob/master/unixfs/format.go#L24
Data.unmarshal = (marshaled) => {
  const decoded = unixfsData.decode(marshaled)

  return new Data({
    type: types[decoded.Type],
    data: decoded.hasData() ? decoded.Data : undefined,
    blockSizes: decoded.blocksizes,
    mode: decoded.hasMode() ? decoded.mode : undefined,
    mtime: decoded.hasMtime() ? new Date(decoded.mtime * 1000) : undefined
  })
}

exports = module.exports = Data
