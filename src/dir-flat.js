'use strict'

const {
  DAGLink,
  DAGNode
} = require('ipld-dag-pb')
const UnixFS = require('ipfs-unixfs')
const Dir = require('./dir')
const persist = require('./utils/persist')

class DirFlat extends Dir {
  constructor (props, options) {
    super(props, options)
    this._children = {}
  }

  put (name, value) {
    this.cid = undefined
    this.size = undefined
    this._children[name] = value
  }

  get (name) {
    return this._children[name]
  }

  childCount () {
    return Object.keys(this._children).length
  }

  directChildrenCount () {
    return this.childCount()
  }

  onlyChild () {
    return this._children[Object.keys(this._children)[0]]
  }

  * eachChildSeries () {
    const keys = Object.keys(this._children)

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]

      yield {
        key: key,
        child: this._children[key]
      }
    }
  }

  async * flush (path, ipld) {
    const children = Object.keys(this._children)
    const links = []

    for (let i = 0; i < children.length; i++) {
      let child = this._children[children[i]]

      if (typeof child.flush === 'function') {
        for await (const entry of child.flush(child.path, ipld)) {
          child = entry

          yield child
        }
      }

      links.push(new DAGLink(children[i], child.node.length || child.node.size, child.cid))
    }

    const unixfs = new UnixFS('directory')
    const node = new DAGNode(unixfs.marshal(), links)
    const cid = await persist(node, ipld, this.options)

    this.cid = cid
    this.size = node.size

    yield {
      cid,
      unixfs,
      path,
      node
    }
  }
}

module.exports = DirFlat
