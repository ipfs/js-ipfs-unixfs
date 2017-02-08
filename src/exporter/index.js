'use strict'

const traverse = require('pull-traverse')
const pull = require('pull-stream')
const CID = require('cids')
const isIPFS = require('is-ipfs')

const util = require('./../util')
const switchType = util.switchType
const cleanMultihash = util.cleanMultihash

const dirExporter = require('./dir')
const fileExporter = require('./file')

module.exports = (hash, ipldResolver, options) => {
  if (!isIPFS.multihash(hash)) {
    return pull.error(new Error('not valid multihash'))
  }

  hash = cleanMultihash(hash)
  options = options || {}

  function visitor (item) {
    if (!item.hash) {
      // having no hash means that this visitor got a file object
      // which needs no further resolving.
      // No further resolving means that the visitor does not
      // need to do anyting else, so he's returning
      // an empty stream

      // TODO: perhaps change the pull streams construct.
      // Instead of traversing with a visitor, consider recursing.
      return pull.empty()
    }
    return pull(
      ipldResolver.getStream(new CID(item.hash)),
      pull.map((result) => result.value),
      pull.map((node) => switchType(
        node,
        () => dirExporter(node, item.path, ipldResolver),
        () => fileExporter(node, item.path, ipldResolver)
      )),
      pull.flatten()
    )
  }

  // Traverse the DAG
  return pull(
    ipldResolver.getStream(new CID(hash)),
    pull.map((result) => result.value),
    pull.map((node) => switchType(
      node,
      () => traverse.widthFirst({path: hash, hash}, visitor),
      () => fileExporter(node, hash, ipldResolver)
    )),
    pull.flatten()
  )
}
