import { encode, prepare } from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import { Dir, CID_V0, CID_V1 } from './dir.js'
import persist from './utils/persist.js'

/**
 * @typedef {import('./types').ImporterOptions} ImporterOptions
 * @typedef {import('./types').ImportResult} ImportResult
 * @typedef {import('./types').InProgressImportResult} InProgressImportResult
 * @typedef {import('interface-blockstore').Blockstore} Blockstore
 * @typedef {import('./dir').DirProps} DirProps
 * @typedef {import('@ipld/dag-pb').PBNode} PBNode
 * @typedef {import('@ipld/dag-pb').PBLink} PBLink
 */

class DirFlat extends Dir {
  /**
   * @param {DirProps} props
   * @param {ImporterOptions} options
   */
  constructor (props, options) {
    super(props, options)

    /** @type {Map<string, InProgressImportResult | Dir>} */
    this._children = new Map()
  }

  /**
   * @param {string} name
   * @param {InProgressImportResult | Dir} value
   */
  async put (name, value) {
    this.cid = undefined
    this.size = undefined
    this.nodeSize = undefined

    this._children.set(name, value)
  }

  /**
   * @param {string} name
   */
  get (name) {
    return Promise.resolve(this._children.get(name))
  }

  childCount () {
    return this._children.size
  }

  directChildrenCount () {
    return this.childCount()
  }

  onlyChild () {
    return this._children.values().next().value
  }

  async * eachChildSeries () {
    for (const [key, child] of this._children.entries()) {
      yield {
        key,
        child
      }
    }
  }

  calculateNodeSize () {
    if (this.nodeSize !== undefined) {
      return this.nodeSize
    }

    const links = []

    for (const [name, child] of this._children.entries()) {
      let size

      if (child instanceof Dir) {
        size = child.calculateNodeSize()
      } else {
        size = child.size
      }

      if (child.size != null && child.cid) {
        links.push({
          Name: name,
          Tsize: size,
          Hash: this.options.cidVersion === 0 ? CID_V0 : CID_V1
        })
      }
    }

    const unixfs = new UnixFS({
      type: 'directory',
      mtime: this.mtime,
      mode: this.mode
    })

    this.nodeSize = encode(prepare({ Data: unixfs.marshal(), Links: links })).length

    return this.nodeSize
  }

  /**
   * @param {Blockstore} block
   * @returns {AsyncIterable<ImportResult>}
   */
  async * flush (block) {
    const links = []

    for (let [name, child] of this._children.entries()) {
      if (child instanceof Dir) {
        for await (const entry of child.flush(block)) {
          child = entry

          yield child
        }
      }

      if (child.size != null && child.cid) {
        links.push({
          Name: name,
          Tsize: child.size,
          Hash: child.cid
        })
      }
    }

    const unixfs = new UnixFS({
      type: 'directory',
      mtime: this.mtime,
      mode: this.mode
    })

    /** @type {PBNode} */
    const node = { Data: unixfs.marshal(), Links: links }
    const buffer = encode(prepare(node))
    const cid = await persist(buffer, block, this.options)
    const size = buffer.length + node.Links.reduce(
      /**
       * @param {number} acc
       * @param {PBLink} curr
       */
      (acc, curr) => acc + (curr.Tsize == null ? 0 : curr.Tsize),
      0)

    this.cid = cid
    this.size = size

    yield {
      cid,
      unixfs,
      path: this.path,
      size
    }
  }
}

export default DirFlat
