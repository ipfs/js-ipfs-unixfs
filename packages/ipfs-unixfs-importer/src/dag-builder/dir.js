'use strict'

const { UnixFS } = require('ipfs-unixfs')
const persist = require('../utils/persist')
const { encode, prepare } = require('@ipld/dag-pb')

/**
 * @typedef {import('../types').Directory} Directory
 */

/**
 * @type {import('../types').UnixFSV1DagBuilder<Directory>}
 */
const dirBuilder = async (item, blockstore, options) => {
  const unixfs = new UnixFS({
    type: 'directory',
    mtime: item.mtime,
    mode: item.mode
  })

  const buffer = encode(prepare({ Data: unixfs.marshal() }))
  const cid = await persist(buffer, blockstore, options)
  const path = item.path

  return {
    cid,
    path,
    unixfs,
    size: buffer.length
  }
}

module.exports = dirBuilder
