import { CID } from 'multiformats/cid'

/**
 * @typedef {import('./types').ImporterOptions} ImporterOptions
 * @typedef {import('./types').ImportResult} ImportResult
 * @typedef {import('./types').InProgressImportResult} InProgressImportResult
 * @typedef {import('interface-blockstore').Blockstore} Blockstore
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
export class Dir {
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
    /** @type {number | undefined} */
    this.nodeSize = undefined
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

  /**
   * @returns {number}
   */
  calculateNodeSize () {
    return 0
  }
}

// we use these to calculate the node size to use as a check for whether a directory
// should be sharded or not. Since CIDs have a constant length and We're only
// interested in the data length and not the actual content identifier we can use
// any old CID instead of having to hash the data which is expensive.
export const CID_V0 = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
export const CID_V1 = CID.parse('zdj7WbTaiJT1fgatdet9Ei9iDB5hdCxkbVyhyh8YTUnXMiwYi')
