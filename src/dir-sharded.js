'use strict'

const {
  DAGLink,
  DAGNode
} = require('ipld-dag-pb')
const UnixFS = require('ipfs-unixfs')
const multihashing = require('multihashing-async')
const Dir = require('./dir')
const persist = require('./utils/persist')
const Bucket = require('hamt-sharding')
const extend = require('deep-extend')

const hashFn = async function (value) {
  const hash = await multihashing(Buffer.from(value, 'utf8'), 'murmur3-128')

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

  return result
}
hashFn.code = 0x22 // TODO: get this from multihashing-async?

const defaultOptions = {
  hashFn: hashFn
}

class DirSharded extends Dir {
  constructor (props, options) {
    options = extend({}, defaultOptions, options)

    super(props, options)

    this._bucket = Bucket(options)
  }

  async put (name, value) {
    await this._bucket.put(name, value)
  }

  get (name) {
    return this._bucket.get(name)
  }

  childCount () {
    return this._bucket.leafCount()
  }

  directChildrenCount () {
    return this._bucket.childrenCount()
  }

  onlyChild () {
    return this._bucket.onlyChild()
  }

  async * eachChildSeries () {
    for await (const { key, value } of this._bucket.eachLeafSeries()) {
      yield {
        key,
        child: value
      }
    }
  }

  async * flush (path, ipld) {
    for await (const entry of flush(path, this._bucket, ipld, this.options)) {
      yield entry
    }
  }
}

module.exports = DirSharded

module.exports.hashFn = hashFn

async function * flush (path, bucket, ipld, options) {
  const children = bucket._children
  const links = []

  for (let i = 0; i < children.length; i++) {
    const child = children.get(i)

    if (!child) {
      continue
    }

    const labelPrefix = i.toString(16).toUpperCase().padStart(2, '0')

    if (Bucket.isBucket(child)) {
      let shard

      for await (const subShard of await flush('', child, ipld, options)) {
        shard = subShard
      }

      links.push(new DAGLink(labelPrefix, shard.node.size, shard.cid))
    } else if (typeof child.value.flush === 'function') {
      const dir = child.value
      let flushedDir

      for await (const entry of dir.flush(dir.path, ipld)) {
        flushedDir = entry

        yield flushedDir
      }

      const label = labelPrefix + child.key
      links.push(new DAGLink(label, flushedDir.node.size, flushedDir.cid))
    } else {
      const value = child.value

      if (!value.node) {
        if (value.cid) {
          value.node = await ipld.get(value.cid)
        } else {
          continue
        }
      }

      const label = labelPrefix + child.key
      const size = value.node.length || value.node.size || value.node.Size

      links.push(new DAGLink(label, size, value.cid))
    }
  }

  // go-ipfs uses little endian, that's why we have to
  // reverse the bit field before storing it
  const data = Buffer.from(children.bitField().reverse())
  const dir = new UnixFS('hamt-sharded-directory', data)
  dir.fanout = bucket.tableSize()
  dir.hashType = options.hashFn.code

  const node = new DAGNode(dir.marshal(), links)
  const cid = await persist(node, ipld, options)

  yield {
    cid,
    node,
    unixfs: dir,
    path
  }
}
