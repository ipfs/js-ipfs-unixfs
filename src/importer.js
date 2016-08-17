'use strict'

const merkleDAG = require('ipfs-merkle-dag')
const UnixFS = require('ipfs-unixfs')
const assert = require('assert')
const pull = require('pull-stream')
const pushable = require('pull-pushable')
const write = require('pull-write')
const parallel = require('run-parallel')

const fsc = require('./chunker-fixed-size')
const createAndStoreTree = require('./tree')

const DAGNode = merkleDAG.DAGNode

const CHUNK_SIZE = 262144

module.exports = (dagService, options) => {
  assert(dagService, 'Missing dagService')

  const files = []

  const source = pushable()
  const sink = write(
    makeWriter(source, files, dagService),
    null,
    100,
    (err) => {
      if (err) return source.end(err)

      createAndStoreTree(files, dagService, source, () => {
        source.end()
      })
    }
  )

  return {source, sink}
}

function makeWriter (source, files, dagService) {
  return (items, cb) => {
    parallel(items.map((item) => (cb) => {
      if (!item.content) {
        return createAndStoreDir(item, dagService, (err, node) => {
          if (err) return cb(err)
          source.push(node)
          files.push(node)
          cb()
        })
      }

      createAndStoreFile(item, dagService, (err, node) => {
        if (err) return cb(err)
        source.push(node)
        files.push(node)
        cb()
      })
    }), cb)
  }
}

function createAndStoreDir (item, ds, cb) {
  // 1. create the empty dir dag node
  // 2. write it to the dag store

  const d = new UnixFS('directory')
  const n = new DAGNode()
  n.data = d.marshal()

  ds.put(n, (err) => {
    if (err) return cb(err)
    cb(null, {
      path: item.path,
      multihash: n.multihash(),
      size: n.size()
      // dataSize: d.fileSize()
    })
  })
}

function createAndStoreFile (file, ds, cb) {
  if (Buffer.isBuffer(file.content)) {
    file.content = pull.values([file.content])
  }

  if (typeof file.content !== 'function') {
    return cb(new Error('invalid content'))
  }

  // 1. create the unixfs merkledag node
  // 2. add its hash and size to the leafs array

  // TODO - Support really large files
  // a) check if we already reach max chunks if yes
  // a.1) create a parent node for all of the current leaves
  // b.2) clean up the leaves array and add just the parent node

  pull(
    file.content,
    fsc(CHUNK_SIZE),
    pull.asyncMap((chunk, cb) => {
      const l = new UnixFS('file', Buffer(chunk))
      const n = new DAGNode(l.marshal())

      ds.put(n, (err) => {
        if (err) {
          return cb(new Error('Failed to store chunk'))
        }

        cb(null, {
          Hash: n.multihash(),
          Size: n.size(),
          leafSize: l.fileSize(),
          Name: ''
        })
      })
    }),
    pull.collect((err, leaves) => {
      if (err) return cb(err)

      if (leaves.length === 1) {
        return cb(null, {
          path: file.path,
          multihash: leaves[0].Hash,
          size: leaves[0].Size
          // dataSize: leaves[0].leafSize
        })
      }

      // create a parent node and add all the leafs

      const f = new UnixFS('file')
      const n = new merkleDAG.DAGNode()

      for (let leaf of leaves) {
        f.addBlockSize(leaf.leafSize)
        n.addRawLink(
          new merkleDAG.DAGLink(leaf.Name, leaf.Size, leaf.Hash)
        )
      }

      n.data = f.marshal()
      ds.put(n, (err) => {
        if (err) return cb(err)

        cb(null, {
          path: file.path,
          multihash: n.multihash(),
          size: n.size()
          // dataSize: f.fileSize()
        })
      })
    })
  )
}
