'use strict'

const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const error = require('pull-stream/sources/error')
const filter = require('pull-stream/throughs/filter')
const map = require('pull-stream/throughs/map')
const CID = require('cids')

const createResolver = require('./resolve').createResolver

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
    rest: toPathComponents(pathRest)
  }
}

const defaultOptions = {
  maxDepth: Infinity,
  offset: undefined,
  length: undefined,
  fullPath: false
}

module.exports = (path, dag, options) => {
  options = Object.assign({}, defaultOptions, options)

  let dPath
  try {
    dPath = pathBaseAndRest(path)
  } catch (err) {
    return error(err)
  }

  const pathLengthToCut = join(
    [dPath.base].concat(dPath.rest.slice(0, dPath.rest.length - 1))).length

  const cid = new CID(dPath.base)

  return pull(
    values([{
      multihash: cid.buffer,
      name: dPath.base,
      path: dPath.base,
      pathRest: dPath.rest,
      depth: 0
    }]),
    createResolver(dag, options),
    filter(Boolean),
    map((node) => {
      return {
        depth: node.depth,
        name: node.name,
        path: options.fullPath ? node.path : finalPathFor(node),
        size: node.size,
        hash: node.multihash,
        content: node.content,
        type: node.type
      }
    })
  )

  function finalPathFor (node) {
    if (!dPath.rest.length) {
      return node.path
    }

    let retPath = node.path.substring(pathLengthToCut)
    if (retPath.charAt(0) === '/') {
      retPath = retPath.substring(1)
    }
    if (!retPath) {
      retPath = dPath.rest[dPath.rest.length - 1] || dPath.base
    }
    return retPath
  }
}

function join (paths) {
  return paths.reduce((acc, path) => {
    if (acc.length) {
      acc += '/'
    }
    return acc + path
  }, '')
}

const toPathComponents = (path = '') => {
  // split on / unless escaped with \
  return (path
    .trim()
    .match(/([^\\^/]|\\\/)+/g) || [])
    .filter(Boolean)
}
