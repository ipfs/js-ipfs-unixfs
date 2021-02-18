'use strict'

/**
 * @typedef {import('./').ImporterOptions} ImporterOptions
 * @typedef {import('./').ImportResult} ImportResult
 * @typedef {import('./').PartialImportResult} PartialImportResult
 * @typedef {import('./').BlockAPI} BlockAPI
 * @typedef {import('cids')} CID
 * @typedef {object} DirProps
 * @property {boolean} root
 * @property {boolean} dir
 * @property {string} path
 * @property {boolean} dirty
 * @property {boolean} flat
 * @property {Dir} [parent]
 * @property {string} [parentKey]
 * @property {import('ipfs-unixfs')} [unixfs]
 * @property {number} [mode]
 * @property {import('ipfs-unixfs').Mtime} [mtime]
 */
class Dir {
  /**
   *
   * @param {DirProps} props
   * @param {ImporterOptions} options
   */
  constructor (props, options) {
    this.options = options || {}

    this.root = props.root
    this.dir = props.dir
    this.path = props.path
    this.dirty = props.dirty
    this.flat = props.flat
    this.parent = props.parent
    this.parentKey = props.parentKey
    this.unixfs = props.unixfs
    this.mode = props.mode
    this.mtime = props.mtime

    /** @type {CID | undefined} */
    this.cid = undefined
    /** @type {number | undefined} */
    this.size = undefined
  }

  /**
   * @param {string} name
   * @param {PartialImportResult | Dir} value
   */
  async put (name, value) { }

  /**
   * @param {string} name
   * @returns {Promise<PartialImportResult | Dir | undefined>}
   */
  get (name) {
    return Promise.resolve(this)
  }

  /**
   * @returns {AsyncIterable<{ key: string, child: PartialImportResult | Dir}>}
   */
  async * eachChildSeries () { }

  /**
   * @param {BlockAPI} block
   * @returns {AsyncIterable<ImportResult>}
   */
  async * flush (block) { }
}

module.exports = Dir
