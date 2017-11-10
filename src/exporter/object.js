'use strict'

const CID = require('cids')
const pull = require('pull-stream')
const pullDefer = require('pull-defer')

module.exports = (node, name, pathRest, ipldResolver, resolve) => {
  let newNode
  if (pathRest.length) {
    const pathElem = pathRest.shift()
    newNode = node[pathElem]
    const newName = name + '/' + pathElem
    if (CID.isCID(newNode)) {
      const d = pullDefer.source()
      ipldResolver.get(sanitizeCID(newNode), (err, newNode) => {
        if (err) {
          d.resolve(pull.error(err))
        } else {
          d.resolve(resolve(newNode.value, newName, pathRest, ipldResolver, node))
        }
      })
      return d
    } else if (newNode !== undefined) {
      return resolve(newNode, newName, pathRest, ipldResolver, node)
    } else {
      return pull.error('not found')
    }
  } else {
    return pull.error(new Error('invalid node type'))
  }
}

function sanitizeCID (cid) {
  return new CID(cid.version, cid.codec, cid.multihash)
}
