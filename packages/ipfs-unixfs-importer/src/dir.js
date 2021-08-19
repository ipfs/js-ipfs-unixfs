/**
 * @typedef {import('./types').ImporterOptions} ImporterOptions
 * @typedef {import('./types').ImportResult} ImportResult
 * @typedef {import('./types').InProgressImportResult} InProgressImportResult
 * @typedef {import('interface-blockstore').Blockstore} Blockstore
 * @typedef {import('multiformats/cid').CID} CID
 *
 * @typedef {object} DirProps
 * @property {boolean} root
 * @property {boolean} dir
 * @property {string} path
 * @property {boolean} dirty
 * @property {boolean} flat
 * @property {Dir} [parent]
 * @property {string} [parentKey]
 * @property {import('ipfs-unixfs').UnixFS} [unixfs]
 * @property {number} [mode]
 * @property {import('ipfs-unixfs').Mtime} [mtime]
 */
class Dir {
  /**
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
   * @param {InProgressImportResult | Dir} value
   */
  async put (name, value) { }

  /**
   * @param {string} name
   * @returns {Promise<InProgressImportResult | Dir | undefined>}
   */
  get (name) {
    return Promise.resolve(this)
  }

  /**
   * @returns {AsyncIterable<{ key: string, child: InProgressImportResult | Dir}>}
   */
  async * eachChildSeries () { }

  /**
   * @param {Blockstore} blockstore
   * @returns {AsyncIterable<ImportResult>}
   */
  async * flush (blockstore) { }
}

export default Dir
