'use strict'

const protons = require('protons')
const pb = protons(require('./unixfs.proto'))
const unixfsData = pb.Data
const errcode = require('err-code')

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

function parseMtime (mtime) {
  if (mtime == null) {
    return undefined
  }

  // { secs, nsecs }
  if (Object.prototype.hasOwnProperty.call(mtime, 'secs')) {
    mtime = {
      secs: mtime.secs,
      nsecs: mtime.nsecs
    }
  }

  // UnixFS TimeSpec
  if (Object.prototype.hasOwnProperty.call(mtime, 'Seconds')) {
    mtime = {
      secs: mtime.Seconds,
      nsecs: mtime.FractionalNanoseconds
    }
  }

  // process.hrtime()
  if (Array.isArray(mtime)) {
    mtime = {
      secs: mtime[0],
      nsecs: mtime[1]
    }
  }

  // Javascript Date
  if (mtime instanceof Date) {
    const ms = mtime.getTime()
    const secs = Math.floor(ms / 1000)

    mtime = {
      secs: secs,
      nsecs: (ms - (secs * 1000)) * 1000
    }
  }

  /*
  TODO: https://github.com/ipfs/aegir/issues/487

  // process.hrtime.bigint()
  if (typeof mtime === 'bigint') {
    const secs = mtime / BigInt(1e9)
    const nsecs = mtime - (secs * BigInt(1e9))

    mtime = {
      secs: parseInt(secs),
      nsecs: parseInt(nsecs)
    }
  }
  */

  if (!Object.prototype.hasOwnProperty.call(mtime, 'secs')) {
    return undefined
  }

  if (mtime.nsecs < 0 || mtime.nsecs > 999999999) {
    throw errcode(new Error('mtime-nsecs must be within the range [0,999999999]'), 'ERR_INVALID_MTIME_NSECS')
  }

  return mtime
}

function parseMode (mode) {
  if (mode == null) {
    return undefined
  }

  if (typeof mode === 'string' || mode instanceof String) {
    mode = parseInt(mode, 8)
  }

  return mode & 0xFFF
}

class Data {
  // decode from protobuf https://github.com/ipfs/specs/blob/master/UNIXFS.md
  static unmarshal (marshaled) {
    const decoded = unixfsData.decode(marshaled)

    const data = new Data({
      type: types[decoded.Type],
      data: decoded.hasData() ? decoded.Data : undefined,
      blockSizes: decoded.blocksizes,
      mode: decoded.hasMode() ? decoded.mode : undefined,
      mtime: decoded.hasMtime() ? decoded.mtime : undefined
    })

    // make sure we honor the original mode
    data._originalMode = decoded.hasMode() ? decoded.mode : undefined

    return data
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
      throw errcode(new Error('Type: ' + type + ' is not valid'), 'ERR_INVALID_TYPE')
    }

    this.type = type
    this.data = data
    this.hashType = hashType
    this.fanout = fanout
    this.blockSizes = blockSizes || []

    const parsedMode = parseMode(mode)

    if (parsedMode !== undefined) {
      this.mode = parsedMode
    }

    if (this.mode === undefined && type === 'file') {
      this.mode = DEFAULT_FILE_MODE
    }

    if (this.mode === undefined && this.isDirectory()) {
      this.mode = DEFAULT_DIRECTORY_MODE
    }

    const parsedMtime = parseMtime(mtime)

    if (parsedMtime) {
      this.mtime = parsedMtime
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
        throw errcode(new Error('Type: ' + type + ' is not valid'), 'ERR_INVALID_TYPE')
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

    if (this.mode != null) {
      mode = (this._originalMode & 0xFFFFF000) | parseMode(this.mode)

      if (mode === DEFAULT_FILE_MODE && this.type === 'file') {
        mode = undefined
      }

      if (mode === DEFAULT_DIRECTORY_MODE && this.isDirectory()) {
        mode = undefined
      }
    }

    let mtime

    if (this.mtime != null) {
      const parsed = parseMtime(this.mtime)

      if (parsed) {
        mtime = {
          Seconds: parsed.secs,
          FractionalNanoseconds: parsed.nsecs
        }

        if (mtime.FractionalNanoseconds === 0) {
          delete mtime.FractionalNanoseconds
        }
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
