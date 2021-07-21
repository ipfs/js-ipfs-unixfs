import { encode, prepare } from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import Dir from './dir.js'
import persist from './utils/persist.js'
import { createHAMT, Bucket } from 'hamt-sharding'

/**
 * @typedef {import('./types').ImporterOptions} ImporterOptions
 * @typedef {import('./types').ImportResult} ImportResult
 * @typedef {import('./types').InProgressImportResult} InProgressImportResult
 * @typedef {import('interface-blockstore').Blockstore} Blockstore
 */

/**
 * @typedef {import('./dir').DirProps} DirProps
 */

class DirSharded extends Dir {
  /**
   * @param {DirProps} props
   * @param {ImporterOptions} options
   */
  constructor (props, options) {
    super(props, options)

    /** @type {Bucket<InProgressImportResult | Dir>} */
    this._bucket = createHAMT({
      hashFn: options.hamtHashFn,
      bits: options.hamtBucketBits
    })
  }

  /**
   * @param {string} name
   * @param {InProgressImportResult | Dir} value
   */
  async put (name, value) {
    await this._bucket.put(name, value)
  }

  /**
   * @param {string} name
   */
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

  /**
   * @param {Blockstore} blockstore
   * @returns {AsyncIterable<ImportResult>}
   */
  async * flush (blockstore) {
    for await (const entry of flush(this._bucket, blockstore, this, this.options)) {
      yield {
        ...entry,
        path: this.path
      }
    }
  }
}

export default DirSharded

/**
 * @param {Bucket<?>} bucket
 * @param {Blockstore} blockstore
 * @param {*} shardRoot
 * @param {ImporterOptions} options
 * @returns {AsyncIterable<ImportResult>}
 */
async function * flush (bucket, blockstore, shardRoot, options) {
  const children = bucket._children
  const links = []
  let childrenSize = 0

  for (let i = 0; i < children.length; i++) {
    const child = children.get(i)

    if (!child) {
      continue
    }

    const labelPrefix = i.toString(16).toUpperCase().padStart(2, '0')

    if (child instanceof Bucket) {
      let shard

      for await (const subShard of await flush(child, blockstore, null, options)) {
        shard = subShard
      }

      if (!shard) {
        throw new Error('Could not flush sharded directory, no subshard found')
      }

      links.push({
        Name: labelPrefix,
        Tsize: shard.size,
        Hash: shard.cid
      })
      childrenSize += shard.size
    } else if (typeof child.value.flush === 'function') {
      const dir = child.value
      let flushedDir

      for await (const entry of dir.flush(blockstore)) {
        flushedDir = entry

        yield flushedDir
      }

      const label = labelPrefix + child.key
      links.push({
        Name: label,
        Tsize: flushedDir.size,
        Hash: flushedDir.cid
      })

      childrenSize += flushedDir.size
    } else {
      const value = child.value

      if (!value.cid) {
        continue
      }

      const label = labelPrefix + child.key
      const size = value.size

      links.push({
        Name: label,
        Tsize: size,
        Hash: value.cid
      })
      childrenSize += size
    }
  }

  // go-ipfs uses little endian, that's why we have to
  // reverse the bit field before storing it
  const data = Uint8Array.from(children.bitField().reverse())
  const dir = new UnixFS({
    type: 'hamt-sharded-directory',
    data,
    fanout: bucket.tableSize(),
    hashType: options.hamtHashCode,
    mtime: shardRoot && shardRoot.mtime,
    mode: shardRoot && shardRoot.mode
  })

  const node = {
    Data: dir.marshal(),
    Links: links
  }
  const buffer = encode(prepare(node))
  const cid = await persist(buffer, blockstore, options)
  const size = buffer.length + childrenSize

  yield {
    cid,
    unixfs: dir,
    size
  }
}
