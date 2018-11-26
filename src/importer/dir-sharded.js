'use strict'

const leftPad = require('left-pad')
const whilst = require('async/whilst')
const waterfall = require('async/waterfall')
const dagPB = require('ipld-dag-pb')
const UnixFS = require('ipfs-unixfs')
const DAGLink = dagPB.DAGLink
const DAGNode = dagPB.DAGNode
const multihashing = require('multihashing-async')
const Dir = require('./dir')
const persist = require('../utils/persist')
const toPull = require('async-iterator-to-pull-stream')
const pull = require('pull-stream/pull')
const onEnd = require('pull-stream/sinks/on-end')
const asyncMap = require('pull-stream/throughs/async-map')
const Bucket = require('hamt-sharding')

const hashFn = function (value) {
  return new Promise((resolve, reject) => {
    multihashing(value, 'murmur3-128', (err, hash) => {
      if (err) {
        reject(err)
      } else {
        // Multihashing inserts preamble of 2 bytes. Remove it.
        // Also, murmur3 outputs 128 bit but, accidently, IPFS Go's
        // implementation only uses the first 64, so we must do the same
        // for parity..
        const justHash = hash.slice(2, 10)
        const length = justHash.length
        const result = Buffer.alloc(length)
        // TODO: invert buffer because that's how Go impl does it
        for (let i = 0; i < length; i++) {
          result[length - i - 1] = justHash[i]
        }
        resolve(result)
      }
    })
  })
}
hashFn.code = 0x22 // TODO: get this from multihashing-async?

const defaultOptions = {
  hashFn: hashFn
}

class DirSharded extends Dir {
  constructor (props, _options) {
    const options = Object.assign({}, defaultOptions, _options)
    super(props, options)
    this._bucket = Bucket(options)
  }

  async put (name, value, callback) {
    try {
      await this._bucket.put(name, value)

      return callback()
    } catch (err) {
      return callback(err)
    }
  }

  async get (name, callback) {
    try {
      return callback(null, await this._bucket.get(name))
    } catch (err) {
      return callback(err)
    }
  }

  childCount () {
    return this._bucket.leafCount()
  }

  directChildrenCount () {
    return this._bucket.childrenCount()
  }

  onlyChild (callback) {
    try {
      return callback(null, this._bucket.onlyChild())
    } catch (err) {
      return callback(err)
    }
  }

  eachChildSeries (iterator, callback) {
    pull(
      toPull(this._bucket.eachLeafSeries()),
      asyncMap((child, cb) => {
        iterator(child.key, child.value, cb)
      }),
      onEnd(callback)
    )
  }

  flush (path, ipld, source, callback) {
    flush(this._options, this._bucket, path, ipld, source, (err, results) => {
      if (err) {
        return callback(err)
      } else {
        this.multihash = results.cid.buffer
        this.size = results.node.size
      }

      callback(null, results)
    })
  }
}

module.exports = createDirSharded
module.exports.hashFn = hashFn

function createDirSharded (props, _options) {
  return new DirSharded(props, _options)
}

function flush (options, bucket, path, ipld, source, callback) {
  const children = bucket._children // TODO: intromission
  let index = 0
  const links = []
  whilst(
    () => index < children.length,
    (callback) => {
      const child = children.get(index)
      if (child) {
        collectChild(child, index, (err) => {
          index++
          callback(err)
        })
      } else {
        index++
        callback()
      }
    },
    (err) => {
      if (err) {
        callback(err)
        return // early
      }
      haveLinks(links, callback)
    }
  )

  function collectChild (child, index, callback) {
    const labelPrefix = leftPad(index.toString(16).toUpperCase(), 2, '0')
    if (Bucket.isBucket(child)) {
      flush(options, child, path, ipld, null, (err, { cid, node }) => {
        if (err) {
          callback(err)
          return // early
        }
        links.push(new DAGLink(labelPrefix, node.size, cid))
        callback()
      })
    } else {
      const value = child.value
      const label = labelPrefix + child.key
      links.push(new DAGLink(label, value.size, value.multihash))
      callback()
    }
  }

  function haveLinks (links, callback) {
    // go-ipfs uses little endian, that's why we have to
    // reverse the bit field before storing it
    const data = Buffer.from(children.bitField().reverse())
    const dir = new UnixFS('hamt-sharded-directory', data)
    dir.fanout = bucket.tableSize()
    dir.hashType = options.hashFn.code
    waterfall([
      (cb) => DAGNode.create(dir.marshal(), links, cb),
      (node, cb) => persist(node, ipld, options, cb),
      ({ cid, node }, cb) => {
        const pushable = {
          path: path,
          size: node.size,
          multihash: cid.buffer
        }
        if (source) {
          source.push(pushable)
        }
        cb(null, { cid, node })
      }
    ], callback)
  }
}
