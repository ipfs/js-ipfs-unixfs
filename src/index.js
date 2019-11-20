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

function Data (type, data) {
  if (!(this instanceof Data)) {
    return new Data(type, data)
  }
  if (types.indexOf(type) === -1) {
    throw new Error('Type: ' + type + ' is not valid')
  }

  this.type = type
  this.data = data
  this.blockSizes = []

  if (this.type === 'file') {
    this.mode = parseInt('0644', 8)
  }

  if (this.type === 'directory' || this.type === 'hamt-sharded-directory') {
    this.mode = parseInt('0755', 8)
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
    if (data) {
      sum += data.length
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

    if ((this.type === 'directory' || this.type === 'hamt-sharded-directory') && this.mode === parseInt('0755', 8)) {
      delete this.mode
    }

    if (this.type === 'file' && this.mode === parseInt('0644', 8)) {
      delete this.mode
    }

    return unixfsData.encode({
      Type: type,
      Data: data,
      filesize: this.fileSize(),
      blocksizes: blockSizes,
      hashType: this.hashType,
      fanout: this.fanout,
      mode: this.mode,
      mtime: this.mtime
    })
  }
}

// decode from protobuf https://github.com/ipfs/go-ipfs/blob/master/unixfs/format.go#L24
Data.unmarshal = (marshaled) => {
  const decoded = unixfsData.decode(marshaled)
  if (!decoded.Data) {
    decoded.Data = undefined
  }
  const obj = new Data(types[decoded.Type], decoded.Data)
  obj.blockSizes = decoded.blocksizes

  if (decoded.mode !== undefined) {
    obj.mode = decoded.mode
  }

  if (decoded.mtime !== undefined) {
    obj.mtime = decoded.mtime
  }

  return obj
}

exports = module.exports = Data
