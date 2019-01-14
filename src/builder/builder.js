'use strict'

const extend = require('deep-extend')
const UnixFS = require('ipfs-unixfs')
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const collect = require('pull-stream/sinks/collect')
const through = require('pull-stream/throughs/through')
const pullThrough = require('pull-through')
const parallel = require('async/parallel')
const waterfall = require('async/waterfall')
const paraMap = require('pull-paramap')
const persist = require('../utils/persist')
const reduce = require('./reduce')
const {
  DAGNode
} = require('ipld-dag-pb')

const defaultOptions = {
  chunkerOptions: {
    maxChunkSize: 262144,
    avgChunkSize: 262144
  },
  rawLeaves: false,
  hashAlg: 'sha2-256',
  leafType: 'file',
  cidVersion: 0,
  progress: () => {}
}

module.exports = function builder (createChunker, ipld, createReducer, _options) {
  const options = extend({}, defaultOptions, _options)
  options.progress = typeof options.progress === 'function' ? options.progress : defaultOptions.progress

  return function (source) {
    return function (items, cb) {
      parallel(items.map((item) => (cb) => {
        if (!item.content) {
          // item is a directory
          return createAndStoreDir(item, (err, node) => {
            if (err) {
              return cb(err)
            }
            if (node) {
              source.push(node)
            }
            cb()
          })
        }

        // item is a file
        createAndStoreFile(item, (err, node) => {
          if (err) {
            return cb(err)
          }
          if (node) {
            source.push(node)
          }
          cb()
        })
      }), cb)
    }
  }

  function createAndStoreDir (item, callback) {
    // 1. create the empty dir dag node
    // 2. write it to the dag store

    const d = new UnixFS('directory')

    waterfall([
      (cb) => DAGNode.create(d.marshal(), [], cb),
      (node, cb) => persist(node, ipld, options, cb)
    ], (err, result) => {
      if (err) {
        return callback(err)
      }

      callback(null, {
        path: item.path,
        multihash: result.cid.buffer,
        size: result.node.size
      })
    })
  }

  function createAndStoreFile (file, callback) {
    if (Buffer.isBuffer(file.content)) {
      file.content = values([file.content])
    }

    if (typeof file.content !== 'function') {
      return callback(new Error('invalid content'))
    }

    const reducer = createReducer(reduce(file, ipld, options), options)
    let chunker

    try {
      chunker = createChunker(options.chunkerOptions)
    } catch (error) {
      return callback(error)
    }

    let previous
    let count = 0

    pull(
      file.content,
      chunker,
      through(buffer => {
        options.progress(buffer.length)
      }),
      paraMap((buffer, callback) => {
        waterfall([
          (cb) => {
            if (options.rawLeaves) {
              return cb(null, {
                size: buffer.length,
                leafSize: buffer.length,
                data: buffer
              })
            }

            const file = new UnixFS(options.leafType, buffer)

            DAGNode.create(file.marshal(), [], (err, node) => {
              if (err) {
                return cb(err)
              }

              cb(null, {
                size: node.size,
                leafSize: file.fileSize(),
                data: node
              })
            })
          },
          (leaf, cb) => {
            persist(leaf.data, ipld, options, (error, results) => {
              if (error) {
                return cb(error)
              }

              cb(null, {
                size: leaf.size,
                leafSize: leaf.leafSize,
                data: results.node,
                multihash: results.cid.buffer,
                path: leaf.path,
                name: ''
              })
            })
          }
        ], callback)
      }),
      pullThrough( // mark as single node if only one single node
        function onData (data) {
          count++
          if (previous) {
            this.queue(previous)
          }
          previous = data
        },
        function ended () {
          if (previous) {
            if (count === 1) {
              previous.single = true
            }
            this.queue(previous)
          }
          this.queue(null)
        }
      ),
      reducer,
      collect((err, roots) => {
        if (err) {
          callback(err)
        } else {
          callback(null, roots[0])
        }
      })
    )
  }
}
