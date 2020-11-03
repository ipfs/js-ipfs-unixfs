'use strict'

const UnixFS = require('ipfs-unixfs')
const persist = require('../../utils/persist')
const {
  DAGNode
} = require('ipld-dag-pb')

async function * bufferImporter (file, source, block, options) {
  for await (let buffer of source) {
    yield async () => {
      options.progress(buffer.length, file.path)
      let unixfs

      const opts = {
        ...options
      }

      if (options.rawLeaves) {
        opts.codec = 'raw'
        opts.cidVersion = 1
      } else {
        unixfs = new UnixFS({
          type: options.leafType,
          data: buffer,
          mtime: file.mtime,
          mode: file.mode
        })

        buffer = new DAGNode(unixfs.marshal()).serialize()
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
