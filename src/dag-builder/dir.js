'use strict'

const UnixFS = require('ipfs-unixfs')
const persist = require('../utils/persist')
const {
  DAGNode
} = require('ipld-dag-pb')

const dirBuilder = async (item, ipld, options) => {
  const unixfs = new UnixFS('directory')
  const node = new DAGNode(unixfs.marshal(), [])
  const cid = await persist(node, ipld, options)
  const path = item.path

  return {
    cid,
    path,
    unixfs,
    node
  }
}

module.exports = dirBuilder
