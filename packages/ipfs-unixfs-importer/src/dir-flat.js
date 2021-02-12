'use strict'

const {
  DAGLink,
  DAGNode
} = require('ipld-dag-pb')
const UnixFS = require('ipfs-unixfs')
const Dir = require('./dir')
const persist = require('./utils/persist')

/**
 * @typedef {import('./').ImporterOptions} ImporterOptions
 * @typedef {import('./').ImportResult} ImportResult
 * @typedef {import('./').PartialImportResult} PartialImportResult
 * @typedef {import('./').BlockAPI} BlockAPI
 * @typedef {import('./dir').DirProps} DirProps
 * @typedef {import('cids')} CID
 */

class DirFlat extends Dir {
  /**
   * @param {DirProps} props
   * @param {ImporterOptions} options
   */
  constructor (props, options) {
    super(props, options)

    /** @type {{ [key: string]: PartialImportResult | Dir }} */
    this._children = {}
  }

  /**
   * @param {string} name
   * @param {PartialImportResult | Dir} value
   */
  async put (name, value) {
    this.cid = undefined
    this.size = undefined

    this._children[name] = value
  }

  /**
   * @param {string} name
   */
  get (name) {
    return Promise.resolve(this._children[name])
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

  async * eachChildSeries () {
    const keys = Object.keys(this._children)

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]

      yield {
        key: key,
        child: this._children[key]
      }
    }
  }

  /**
   * @param {string} path
   * @param {BlockAPI} block
   * @returns {AsyncIterable<ImportResult>}
   */
  async * flush (path, block) {
    const children = Object.keys(this._children)
    const links = []

    for (let i = 0; i < children.length; i++) {
      let child = this._children[children[i]]

      if (child instanceof Dir) {
        for await (const entry of child.flush(child.path, block)) {
          child = entry

          yield child
        }
      }

      if (child.size != null && child.cid) {
        links.push(new DAGLink(children[i], child.size, child.cid))
      }
    }

    const unixfs = new UnixFS({
      type: 'directory',
      mtime: this.mtime,
      mode: this.mode
    })

    const node = new DAGNode(unixfs.marshal(), links)
    const buffer = node.serialize()
    const cid = await persist(buffer, block, this.options)
    const size = buffer.length + node.Links.reduce(
      /**
       * @param {number} acc
       * @param {DAGLink} curr
       */
      (acc, curr) => acc + curr.Tsize,
      0)

    this.cid = cid
    this.size = size

    yield {
      cid,
      unixfs,
      path,
      size
    }
  }
}

module.exports = DirFlat
