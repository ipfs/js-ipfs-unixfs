'use strict'

const pull = require('pull-stream')
const CID = require('cids')
const pullDefer = require('pull-defer')

const resolve = require('./resolve').resolve

function pathBaseAndRest (path) {
  // Buffer -> raw multihash or CID in buffer
  let pathBase = path
  let pathRest = '/'

  if (Buffer.isBuffer(path)) {
    pathBase = (new CID(path)).toBaseEncodedString()
  }

  if (typeof path === 'string') {
    if (path.indexOf('/ipfs/') === 0) {
      path = pathBase = path.substring(6)
    }
    const subtreeStart = path.indexOf('/')
    if (subtreeStart > 0) {
      pathBase = path.substring(0, subtreeStart)
      pathRest = path.substring(subtreeStart)
    }
  } else if (CID.isCID(pathBase)) {
    pathBase = pathBase.toBaseEncodedString()
  }

  pathBase = (new CID(pathBase)).toBaseEncodedString()

  return {
    base: pathBase,
    rest: pathRest.split('/').filter(Boolean)
  }
}

module.exports = (path, dag) => {
  try {
    path = pathBaseAndRest(path)
  } catch (err) {
    return pull.error(err)
  }

  const d = pullDefer.source()

  const cid = new CID(path.base)

  dag.get(cid, (err, node) => {
    if (err) {
      return pull.error(err)
    }
    d.resolve(pull.values([node]))
  })

  return pull(
    d,
    pull.map((result) => result.value),
    pull.map((node) => resolve(node, path.base, path.rest, dag)),
    pull.flatten()
  )
}
