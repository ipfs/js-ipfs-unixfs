'use strict'

const { UnixFS } = require('ipfs-unixfs')
const persist = require('../utils/persist')
const {
  DAGNode
} = require('ipld-dag-pb')

/**
 * @typedef {import('../types').Directory} Directory
 */

/**
 * @type {import('../types').UnixFSV1DagBuilder<Directory>}
 */
const dirBuilder = async (item, block, options) => {
  const unixfs = new UnixFS({
    type: 'directory',
    mtime: item.mtime,
    mode: item.mode
  })

  const buffer = new DAGNode(unixfs.marshal()).serialize()
  const cid = await persist(buffer, block, options)
  const path = item.path

  return {
    cid,
    path,
    unixfs,
    size: buffer.length
  }
}

module.exports = dirBuilder
