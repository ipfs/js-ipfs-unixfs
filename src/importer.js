'use strict'

const debug = require('debug')
const log = debug('importer')
log.err = debug('importer:error')
const fsc = require('./chunker-fixed-size')
const through2 = require('through2')
const merkleDAG = require('ipfs-merkle-dag')
const UnixFS = require('ipfs-unixfs')
const EE2 = require('eventemitter2').EventEmitter2
const util = require('util')
const bs58 = require('bs58')

exports = module.exports = Importer

const CHUNK_SIZE = 262144

util.inherits(Importer, EE2)

function Importer (dagService, options) {
  if (!(this instanceof Importer)) {
    return new Importer(dagService)
  }

  if (!dagService) {
    return new Error('must specify a dagService')
  }

  const files = []
  var counter = 0

  this.add = (fl) => {
    counter++
    if (!fl.stream) {
      // 1. create the empty dir dag node
      // 2. write it to the dag store
      // 3. add to the files array {path: <>, hash: <>}
      // 4. emit the path + hash
      const d = new UnixFS('directory')
      const n = new merkleDAG.DAGNode()
      n.data = d.marshal()
      dagService.add(n, (err) => {
        if (err) {
          return this.emit('err', 'Failed to store' + fl.path)
        }
        const el = {
          path: fl.path,
          multihash: n.multihash(),
          size: n.size(),
          dataSize: d.fileSize()
        }

        files.push(el)
        this.emit('file', el)
      })
      return
    }

    const leaves = []

    fl.stream
      .pipe(fsc(CHUNK_SIZE))
      .pipe(through2((chunk, enc, cb) => {
        // 1. create the unixfs merkledag node
        // 2. add its hash and size to the leafs array

        // TODO - Support really large files
        // a) check if we already reach max chunks if yes
        // a.1) create a parent node for all of the current leaves
        // b.2) clean up the leaves array and add just the parent node

        const l = new UnixFS('file', chunk)
        const n = new merkleDAG.DAGNode(l.marshal())

        dagService.add(n, function (err) {
          if (err) {
            return this.emit('err', 'Failed to store chunk of' + fl.path)
          }

          leaves.push({
            Hash: n.multihash(),
            Size: n.size(),
            leafSize: l.fileSize(),
            Name: ''
          })

          cb()
        })
      }, (cb) => {
        if (leaves.length === 1) {
          // 1. add to the files array {path: <>, hash: <>}
          // 2. emit the path + hash

          const el = {
            path: fl.path,
            multihash: leaves[0].Hash,
            size: leaves[0].Size,
            dataSize: leaves[0].leafSize
          }

          files.push(el)
          this.emit('file', el)
          return done(cb)
        }
        // 1. create a parent node and add all the leafs
        // 2. add to the files array {path: <>, hash: <>}
        // 3. emit the path + hash of the parent node

        const f = new UnixFS('file')
        const n = new merkleDAG.DAGNode()

        leaves.forEach((leaf) => {
          f.addBlockSize(leaf.leafSize)
          const l = new merkleDAG.DAGLink(leaf.Name, leaf.Size, leaf.Hash)
          n.addRawLink(l)
        })

        n.data = f.marshal()
        dagService.add(n, (err) => {
          if (err) {
            this.emit('err', 'Failed to store' + fl.path)
            return cb()
          }

          const el = {
            path: fl.path,
            multihash: n.multihash(),
            size: n.size()
            // dataSize: f.fileSize()
          }

          files.push(el)
          this.emit('file', el)
          return done(cb)
        })
      }))
    function done (cb) {
      counter--
      cb()
    }
  }

  this.finish = () => {
    // if (files.length === 1) {
    //  // The file was already emitted, nothing to do here
    //  return
    // }

    if (counter > 0) {
      return setTimeout(this.finish, 200)
    }

    // file struct
    // {
    //   path: // full path
    //   multihash: // multihash of the dagNode
    //   size: // cumulative size
    //   dataSize: // dagNode size
    // }

    // 1) convert files to a tree
    // for each path, split, add to a json tree and in the end the name of the
    // file points to an object that is has a key multihash and respective value
    // { foo: { bar: { baz.txt: <multihash> }}}
    // the stop condition is if the value is not an object
    const fileTree = {}

    files.forEach((file) => {
      let splitted = file.path.split('/')
      if (splitted.length === 1) {
        return // adding just one file
        // fileTree[file.path] = bs58.encode(file.multihash).toString()
      }
      if (splitted[0] === '') {
        splitted = splitted.slice(1)
      }
      var tmpTree = fileTree

      for (var i = 0; i < splitted.length; i++) {
        if (!tmpTree[splitted[i]]) {
          tmpTree[splitted[i]] = {}
        }
        if (i === splitted.length - 1) {
          tmpTree[splitted[i]] = file.multihash
        } else {
          tmpTree = tmpTree[splitted[i]]
        }
      }
    })

    if (Object.keys(fileTree).length === 0) {
      return // no dirs to be created
    }

    // 2) create a index for multihash: { size, dataSize } so
    // that we can fetch these when creating the merkle dag nodes

    const mhIndex = {}

    files.forEach((file) => {
      mhIndex[bs58.encode(file.multihash)] = {
        size: file.size,
        dataSize: file.dataSize
      }
    })

    // 3) expand leaves recursively
    // create a dirNode
    // Object.keys
    // If the value is an Object
    //   create a dir Node
    //   Object.keys
    //   Once finished, add the result as a link to the dir node
    // If the value is not an object
    //   add as a link to the dirNode

    function traverse (tree, base) {
      const keys = Object.keys(tree)
      let tmpTree = tree
      keys.map((key) => {
        if (typeof tmpTree[key] === 'object' &&
            !Buffer.isBuffer(tmpTree[key])) {
          tmpTree[key] = traverse.call(this, tmpTree[key], base ? base + '/' + key : key)
        }
      })

      // at this stage, all keys are multihashes
      // create a dir node
      // add all the multihashes as links
      // return this new node multihash

      const d = new UnixFS('directory')
      const n = new merkleDAG.DAGNode()

      keys.forEach((key) => {
        const b58mh = bs58.encode(tmpTree[key])
        const l = new merkleDAG.DAGLink(
            key, mhIndex[b58mh].size, tmpTree[key])
        n.addRawLink(l)
      })

      n.data = d.marshal()
      dagService.add(n, (err) => {
        if (err) {
          this.emit('err', 'failed to store dirNode')
        }
      })

      if (!base) {
        return
      }

      const el = {
        path: base,
        multihash: n.multihash(),
        size: n.size()
        // dataSize: '' // f.fileSize()
      }

      this.emit('file', el)

      mhIndex[bs58.encode(n.multihash())] = { size: n.size() }
      return n.multihash()
    }
    /* const rootHash = */ traverse.call(this, fileTree)

    // TODO
    // Since we never shoot for adding multiple directions at the root level, the following might not be necessary, reserving it for later:
    //
    // if at the first level, there was only one key (most cases)
    // do nothing, if there was many, emit a rootHash with '/'
    // emit root hash as well (as '/')
  }
}
