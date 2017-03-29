'use strict'

const asyncEachSeries = require('async/eachSeries')
const waterfall = require('async/waterfall')
const CID = require('cids')
const dagPB = require('ipld-dag-pb')
const UnixFS = require('ipfs-unixfs')
const DAGLink = dagPB.DAGLink
const DAGNode = dagPB.DAGNode
const Dir = require('./dir')

class DirFlat extends Dir {
  constructor (props) {
    super()
    this._children = {}
    Object.assign(this, props)
  }

  put (name, value, callback) {
    this.multihash = undefined
    this.size = undefined
    this._children[name] = value
    process.nextTick(callback)
  }

  get (name, callback) {
    process.nextTick(() => callback(null, this._children[name]))
  }

  childCount () {
    return Object.keys(this._children).length
  }

  directChildrenCount () {
    return this.childCount()
  }

  onlyChild (callback) {
    process.nextTick(() => callback(null, this._children[Object.keys(this._children)[0]]))
  }

  eachChildSeries (iterator, callback) {
    asyncEachSeries(
      Object.keys(this._children),
      (key, callback) => {
        iterator(key, this._children[key], callback)
      },
      callback
    )
  }

  flush (path, ipldResolver, source, callback) {
    const links = Object.keys(this._children)
      .map((key) => {
        const child = this._children[key]
        return new DAGLink(key, child.size, child.multihash)
      })

    const dir = new UnixFS('directory')
    waterfall(
      [
        (callback) => DAGNode.create(dir.marshal(), links, callback),
        (node, callback) => {
          ipldResolver.put(
            node,
            {
              cid: new CID(node.multihash)
            },
            (err) => callback(err, node))
        },
        (node, callback) => {
          this.multihash = node.multihash
          this.size = node.size
          const pushable = {
            path: path,
            multihash: node.multihash,
            size: node.size
          }
          source.push(pushable)
          callback(null, node)
        }
      ],
      callback)
  }
}

module.exports = createDirFlat

function createDirFlat (props) {
  return new DirFlat(props)
}
