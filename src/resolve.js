'use strict'

const UnixFS = require('ipfs-unixfs')
const pull = require('pull-stream/pull')
const error = require('pull-stream/sources/error')
const filter = require('pull-stream/throughs/filter')
const flatten = require('pull-stream/throughs/flatten')
const map = require('pull-stream/throughs/map')
const paramap = require('pull-paramap')
const CID = require('cids')
const waterfall = require('async/waterfall')

const resolvers = {
  directory: require('./dir-flat'),
  'hamt-sharded-directory': require('./dir-hamt-sharded'),
  file: require('./file'),
  object: require('./object'),
  raw: require('./raw')
}

module.exports = Object.assign({
  createResolver: createResolver,
  typeOf: typeOf
}, resolvers)

function createResolver (dag, options, depth, parent) {
  if (!depth) {
    depth = 0
  }

  if (depth > options.maxDepth) {
    return map(identity)
  }

  return pull(
    paramap((item, cb) => {
      if ((typeof item.depth) !== 'number') {
        return error(new Error('no depth'))
      }

      if (item.object) {
        return cb(null, resolveItem(null, item.object, item, options))
      }

      const cid = new CID(item.multihash)

      waterfall([
        (done) => dag.get(cid, done),
        (node, done) => done(null, resolveItem(cid, node.value, item, options))
      ], cb)
    }),
    flatten(),
    filter(Boolean),
    filter((node) => node.depth <= options.maxDepth)
  )

  function resolveItem (cid, node, item, options) {
    return resolve({
      cid,
      node,
      name: item.name,
      path: item.path,
      pathRest: item.pathRest,
      size: item.size,
      dag,
      parentNode: item.parent || parent,
      depth: item.depth,
      options
    })
  }

  function resolve ({ cid, node, name, path, pathRest, size, dag, parentNode, depth, options }) {
    let type

    try {
      type = typeOf(node)
    } catch (err) {
      return error(err)
    }

    const nodeResolver = resolvers[type]

    if (!nodeResolver) {
      return error(new Error('Unkown node type ' + type))
    }

    const resolveDeep = createResolver(dag, options, depth, node)

    return nodeResolver(cid, node, name, path, pathRest, resolveDeep, size, dag, parentNode, depth, options)
  }
}

function typeOf (node) {
  if (Buffer.isBuffer(node)) {
    return 'raw'
  } else if (Buffer.isBuffer(node.data)) {
    return UnixFS.unmarshal(node.data).type
  } else {
    return 'object'
  }
}

function identity (o) {
  return o
}
