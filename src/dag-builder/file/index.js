'use strict'

const errCode = require('err-code')
const UnixFS = require('ipfs-unixfs')
const persist = require('../../utils/persist')
const {
  DAGNode,
  DAGLink
} = require('ipld-dag-pb')
const all = require('it-all')
const parallelBatch = require('it-parallel-batch')

const dagBuilders = {
  flat: require('./flat'),
  balanced: require('./balanced'),
  trickle: require('./trickle')
}

async function * importBuffer (file, source, ipld, options) {
  for await (const buffer of source) {
    yield async () => {
      options.progress(buffer.length)
      let node
      let unixfs

      const opts = {
        ...options
      }

      if (options.rawLeaves) {
        node = buffer

        opts.codec = 'raw'
        opts.cidVersion = 1
      } else {
        unixfs = new UnixFS(options.leafType, buffer)

        if (file.mtime) {
          unixfs.mtime = file.mtime
        }

        if (file.mode) {
          unixfs.mode = file.mode
        }

        node = new DAGNode(unixfs.marshal())
      }

      const cid = await persist(node, ipld, opts)

      return {
        cid: cid,
        unixfs,
        node
      }
    }
  }
}

async function * buildFileBatch (file, source, ipld, options) {
  let count = -1
  let previous

  for await (const entry of parallelBatch(importBuffer(file, source, ipld, options), options.blockWriteConcurrency)) {
    count++

    if (count === 0) {
      previous = entry
      continue
    } else if (count === 1) {
      yield previous
      previous = null
    }

    yield entry
  }

  if (previous) {
    previous.single = true
    yield previous
  }
}

const reduce = (file, ipld, options) => {
  return async function (leaves) {
    if (leaves.length === 1 && leaves[0].single && options.reduceSingleLeafToSelf) {
      const leaf = leaves[0]

      return {
        cid: leaf.cid,
        path: file.path,
        name: (file.path || '').split('/').pop(),
        unixfs: leaf.unixfs,
        node: leaf.node
      }
    }

    // create a parent node and add all the leaves
    const f = new UnixFS('file')

    if (file.mtime) {
      f.mtime = file.mtime
    }

    if (file.mode) {
      f.mode = file.mode
    }

    const links = leaves
      .filter(leaf => {
        if (leaf.cid.codec === 'raw' && leaf.node.length) {
          return true
        }

        if (!leaf.unixfs.data && leaf.unixfs.fileSize()) {
          return true
        }

        return Boolean(leaf.unixfs.data.length)
      })
      .map((leaf) => {
        if (leaf.cid.codec === 'raw') {
          // node is a leaf buffer
          f.addBlockSize(leaf.node.length)

          return new DAGLink(leaf.name, leaf.node.length, leaf.cid)
        }

        if (!leaf.unixfs.data) {
          // node is an intermediate node
          f.addBlockSize(leaf.unixfs.fileSize())
        } else {
          // node is a unixfs 'file' leaf node
          f.addBlockSize(leaf.unixfs.data.length)
        }

        return new DAGLink(leaf.name, leaf.node.size, leaf.cid)
      })

    const node = new DAGNode(f.marshal(), links)
    const cid = await persist(node, ipld, options)

    return {
      cid,
      path: file.path,
      unixfs: f,
      node,
      size: node.size
    }
  }
}

const fileBuilder = async (file, source, ipld, options) => {
  const dagBuilder = dagBuilders[options.strategy]

  if (!dagBuilder) {
    throw errCode(new Error(`Unknown importer build strategy name: ${options.strategy}`), 'ERR_BAD_STRATEGY')
  }

  const roots = await all(dagBuilder(buildFileBatch(file, source, ipld, options), reduce(file, ipld, options), options))

  if (roots.length > 1) {
    throw errCode(new Error('expected a maximum of 1 roots and got ' + roots.length), 'ETOOMANYROOTS')
  }

  return roots[0]
}

module.exports = fileBuilder
