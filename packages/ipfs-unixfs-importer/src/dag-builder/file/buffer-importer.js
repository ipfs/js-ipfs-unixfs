'use strict'

const { UnixFS } = require('ipfs-unixfs')
const persist = require('../../utils/persist')
const dagPb = require('@ipld/dag-pb')
const raw = require('multiformats/codecs/raw')

/**
 * @typedef {import('../../types').BufferImporter} BufferImporter
 */

/**
 * @type {BufferImporter}
 */
async function * bufferImporter (file, block, options) {
  for await (let buffer of file.content) {
    yield async () => {
      options.progress(buffer.length, file.path)
      let unixfs

      /** @type {import('../../types').PersistOptions} */
      const opts = {
        codec: dagPb,
        cidVersion: options.cidVersion,
        hasher: options.hasher,
        onlyHash: options.onlyHash
      }

      if (options.rawLeaves) {
        opts.codec = raw
        opts.cidVersion = 1
      } else {
        unixfs = new UnixFS({
          type: options.leafType,
          data: buffer,
          mtime: file.mtime,
          mode: file.mode
        })

        buffer = dagPb.encode({
          Data: unixfs.marshal(),
          Links: []
        })
      }

      return {
        cid: await persist(buffer, block, opts),
        unixfs,
        size: buffer.length
      }
    }
  }
}

module.exports = bufferImporter
