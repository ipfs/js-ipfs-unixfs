'use strict'

const pb = require('./unixfs.proto.js')
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
    let fileSize = this.fileSize()

    if (!fileSize) {
      fileSize = undefined
    }

    const msg = unixfsData.create({
      Type: type,
      Data: this.data,
      filesize: fileSize,
      blocksizes: this.blockSizes.length > 0 ? this.blockSizes : undefined,
      hashType: this.hashType,
      fanout: this.fanout
    })

    return unixfsData.encode(msg).finish()
  }
}

// decode from protobuf https://github.com/ipfs/go-ipfs/blob/master/unixfs/format.go#L24
Data.unmarshal = (marsheled) => {
  const decoded = unixfsData.decode(marsheled)
  if (!decoded.Data || decoded.Data.length === 0) {
    decoded.Data = undefined
  }

  const obj = new Data(types[decoded.Type], decoded.Data)
  obj.blockSizes = (decoded.blocksizes || []).map((s) => {
    return typeof s.toNumber === 'function' ? s.toNumber() : s
  })
  return obj
}

exports = module.exports = Data
