'use strict'

const UnixFS = require('ipfs-unixfs')
const persist = require('../../utils/persist')
const {
  DAGNode
} = require('ipld-dag-pb')

async function * bufferImporter (file, source, ipld, options) {
  for await (const buffer of source) {
    yield async () => {
      options.progress(buffer.length)
      let node
      let unixfs
      let size

      const opts = {
        ...options
      }

      if (options.rawLeaves) {
        node = buffer
        size = buffer.length

        opts.codec = 'raw'
        opts.cidVersion = 1
      } else {
        unixfs = new UnixFS({
          type: options.leafType,
          data: buffer,
          mtime: file.mtime,
          mode: file.mode
        })

        node = new DAGNode(unixfs.marshal())
        size = node.size
      }

      const cid = await persist(node, ipld, opts)

      return {
        cid: cid,
        unixfs,
        size
      }
    }
  }
}

module.exports = bufferImporter
