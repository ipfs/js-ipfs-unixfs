const fs = require('fs')
const path = require('path')
const protobuf = require('protocol-buffers')
const schema = fs.readFileSync(path.resolve(__dirname, 'unixfs.proto'))
const pb = protobuf(schema)
const unixfsData = pb.Data // encode/decode
// const unixfsMetadata = pb.MetaData // encode/decode

const types = [
  'raw',
  'directory',
  'file',
  'metadata',
  'symlink'
]

exports = module.exports = Data

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
    var sum = 0
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
    var type

    switch (this.type) {
      case 'raw': type = unixfsData.DataType.Raw; break
      case 'directory': type = unixfsData.DataType.Directory; break
      case 'file': type = unixfsData.DataType.File; break
      case 'metadata': type = unixfsData.DataType.Metadata; break
      case 'symlink': type = unixfsData.DataType.Symlink; break
    }

    return unixfsData.encode({
      Type: type,
      Data: this.data,
      filesize: this.fileSize(),
      blocksizes: this.blockSizes
    })
  }
}

// decode from protobuf https://github.com/ipfs/go-ipfs/blob/master/unixfs/format.go#L24
exports.unmarshal = (marsheled) => {
  const decoded = unixfsData.decode(marsheled)
  if (!decoded.Data) {
    decoded.Data = undefined
  }
  const obj = new Data(types[decoded.Type], decoded.Data)
  obj.blockSizes = decoded.blocksizes
  return obj
}
