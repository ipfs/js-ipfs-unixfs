'use strict'

const extend = require('deep-extend')
const UnixFS = require('ipfs-unixfs')
const pull = require('pull-stream')
const through = require('pull-through')
const parallel = require('async/parallel')
const waterfall = require('async/waterfall')
const dagPB = require('ipld-dag-pb')
const CID = require('cids')

const reduce = require('./reduce')

const DAGNode = dagPB.DAGNode

const defaultOptions = {
  chunkerOptions: {
    maxChunkSize: 262144
  }
}

module.exports = function (createChunker, ipldResolver, createReducer, _options) {
  const options = extend({}, defaultOptions, _options)

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
      (cb) => DAGNode.create(d.marshal(), [], options.hashAlg, cb),
      (node, cb) => {
        ipldResolver.put(node, {
          cid: new CID(node.multihash)
        }, (err) => cb(err, node))
      }
    ], (err, node) => {
      if (err) {
        return callback(err)
      }
      callback(null, {
        path: item.path,
        multihash: node.multihash,
        size: node.size
      })
    })
  }

  function createAndStoreFile (file, callback) {
    if (Buffer.isBuffer(file.content)) {
      file.content = pull.values([file.content])
    }

    if (typeof file.content !== 'function') {
      return callback(new Error('invalid content'))
    }

    const reducer = createReducer(reduce(file, ipldResolver, options), options)

    let previous
    let count = 0

    pull(
      file.content,
      createChunker(options.chunkerOptions),
      pull.map(chunk => {
        if (options.progress && typeof options.progress === 'function') {
          options.progress(chunk.byteLength)
        }
        return new Buffer(chunk)
      }),
      pull.map(buffer => new UnixFS('file', buffer)),
      pull.asyncMap((fileNode, callback) => {
        DAGNode.create(fileNode.marshal(), [], options.hashAlg, (err, node) => {
          callback(err, { DAGNode: node, fileNode: fileNode })
        })
      }),
      pull.asyncMap((leaf, callback) => {
        ipldResolver.put(leaf.DAGNode, {
          cid: new CID(leaf.DAGNode.multihash)
        }, (err) => callback(err, leaf)
        )
      }),
      pull.map((leaf) => {
        return {
          path: file.path,
          multihash: leaf.DAGNode.multihash,
          size: leaf.DAGNode.size,
          leafSize: leaf.fileNode.fileSize(),
          name: ''
        }
      }),
      through( // mark as single node if only one single node
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
      pull.collect((err, roots) => {
        if (err) {
          callback(err)
        } else {
          callback(null, roots[0])
        }
      })
    )
  }
}
