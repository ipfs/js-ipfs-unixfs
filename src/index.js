'use strict'

const debug = require('debug')
const log = debug('importer')
log.err = debug('importer:error')
const fs = require('fs')
const mDAG = require('ipfs-merkle-dag')
const FixedSizeChunker = require('./chunker-fixed-size')
const through2 = require('through2')
const UnixFS = require('ipfs-unixfs')
const async = require('async')
const events = require('events')
const Readable = require('stream').Readable
const pathj = require('path')

exports = module.exports

const CHUNK_SIZE = 262144

// Use a layout + chunkers to convert a directory (or file) to the layout format
exports.import = (target, dagService, options, callback) => {
  if (typeof options === 'function') { callback = options; options = {} }

  if (!target) { return callback(new Error('must specify target')) }
  if (!dagService) { return callback(new Error('must specify dag service')) }

  // options.recursive : follow dirs
  // options.chunkers : obj with chunkers to each type of data, { default: dumb-chunker }

  options = options || {}

  if (Buffer.isBuffer(target)) {
    bufferImporter(target, callback)
  } else if (typeof target.on === 'function') {
    // TODO Create Stream Importer
    // streamImporter(options.stream, callback)
    return callback(new Error('stream importer has not been built yet'))
  } else if (typeof target === 'string') {
    var stats
    try {
      stats = fs.statSync(target)
    } catch (e) {
      return callback(e)
    }
    if (stats.isFile()) {
      fileImporter(target, callback)
    } else if (stats.isDirectory() && options.recursive) {
      dirImporter(target, callback)
    } else {
      return callback(new Error('recursive must be true to add a directory'))
    }
  }

  function fileImporter (path, callback) {
    const stats = fs.statSync(path)
    if (stats.size > CHUNK_SIZE) {
      const links = [] // { Hash: , Size: , Name: }
      fs.createReadStream(path)
        .pipe(new FixedSizeChunker(CHUNK_SIZE))
        .pipe(through2((chunk, enc, cb) => {
          // TODO: check if this is right (I believe it should be type 'raw'
          // https://github.com/ipfs/go-ipfs/issues/2331
          const raw = new UnixFS('file', chunk)

          const node = new mDAG.DAGNode(raw.marshal())

          dagService.add(node, function (err) {
            if (err) {
              return log.err(err)
            }
            links.push({
              Hash: node.multihash(),
              Size: node.size(),
              leafSize: raw.fileSize(),
              Name: ''
            })
            cb()
          })
        }, (cb) => {
          const file = new UnixFS('file')
          const parentNode = new mDAG.DAGNode()
          links.forEach((l) => {
            file.addBlockSize(l.leafSize)
            const link = new mDAG.DAGLink(l.Name, l.Size, l.Hash)
            parentNode.addRawLink(link)
          })

          parentNode.data = file.marshal()
          dagService.add(parentNode, (err) => {
            if (err) {
              return log.err(err)
            }

            const pathSplit = path.split('/')
            const fileName = pathSplit[pathSplit.length - 1]

            callback(null, {
              Hash: parentNode.multihash(),
              Size: parentNode.size(),
              Name: fileName
            }) && cb()
          })
        }))
    } else {
      // create just one file node with the data directly
      var buf = fs.readFileSync(path)
      const fileUnixFS = new UnixFS('file', buf)
      const fileNode = new mDAG.DAGNode(fileUnixFS.marshal())

      dagService.add(fileNode, (err) => {
        if (err) {
          return log.err(err)
        }

        const split = path.split('/')
        const fileName = split[split.length - 1]

        callback(null, {
          Hash: fileNode.multihash(),
          Size: fileNode.size(),
          Name: fileName
        })
      })
    }
  }

  function dirImporter (path, callback) {
    const files = fs.readdirSync(path)
    const dirUnixFS = new UnixFS('directory')
    const dirNode = new mDAG.DAGNode()

    if (files.length === 0) {
      dirNode.data = dirUnixFS.marshal()
      dagService.add(dirNode, (err) => {
        if (err) {
          return callback(err)
        }

        const split = path.split('/')
        const dirName = split[split.length - 1]

        callback(null, {
          Hash: dirNode.multihash(),
          Size: dirNode.size(),
          Name: dirName
        })
      })
      return
    }

    async.map(
      files,
      (file, cb) => {
        const filePath = path + '/' + file
        const stats = fs.statSync(filePath)
        if (stats.isFile()) {
          return fileImporter(filePath, cb)
        } if (stats.isDirectory()) {
          return dirImporter(filePath, cb)
        } else {
          return cb(new Error('Found a weird file' + path + file))
        }
      },
      (err, results) => {
        if (err) {
          return callback(err)
        }
        results.forEach((result) => {
          dirNode.addRawLink(new mDAG.DAGLink(result.Name, result.Size, result.Hash))
        })

        dirNode.data = dirUnixFS.marshal()

        dagService.add(dirNode, (err) => {
          if (err) {
            return callback(err)
          }

          const split = path.split('/')
          const dirName = split[split.length - 1]

          callback(null, {
            Hash: dirNode.multihash(),
            Size: dirNode.size(),
            Name: dirName
          })
        })
      })
  }
  function bufferImporter (buffer, callback) {
    const links = [] // { Hash: , Size: , Name: }
    if (buffer.length > CHUNK_SIZE) {
      var fsc = new FixedSizeChunker(CHUNK_SIZE)
      fsc.write(buffer)
      fsc.end()
      fsc.pipe(through2((chunk, enc, cb) => {
        // TODO: check if this is right (I believe it should be type 'raw'
        // https://github.com/ipfs/go-ipfs/issues/2331
        const raw = new UnixFS('file', chunk)
        const node = new mDAG.DAGNode(raw.marshal())

        dagService.add(node, function (err) {
          if (err) {
            return log.err(err)
          }
          links.push({
            Hash: node.multihash(),
            Size: node.size(),
            leafSize: raw.fileSize(),
            Name: ''
          })
          cb()
        })
      }, (cb) => {
        const file = new UnixFS('file')
        const parentNode = new mDAG.DAGNode()
        links.forEach((l) => {
          file.addBlockSize(l.leafSize)
          const link = new mDAG.DAGLink(l.Name, l.Size, l.Hash)
          parentNode.addRawLink(link)
        })
        parentNode.data = file.marshal()
        dagService.add(parentNode, (err) => {
          if (err) {
            return log.err(err)
          }

          callback(null, {
            Hash: parentNode.multihash(),
            Size: parentNode.size()
          }) && cb()
        })
      }))
    } else {
      // create just one file node with the data directly
      const fileUnixFS = new UnixFS('file', buffer)
      const fileNode = new mDAG.DAGNode(fileUnixFS.marshal())

      dagService.add(fileNode, (err) => {
        if (err) {
          return log.err(err)
        }

        callback(null, {
          Hash: fileNode.multihash(),
          Size: fileNode.size()
        })
      })
    }
  }
  // function streamImporter (stream, callback) {}
}

exports.export = function (hash, dagService, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const ee = new events.EventEmitter()
  dagService.get(hash, (err, fetchedNode) => {
    if (err) {
      if (callback) {
        return callback(err)
      }
      return
    }
    const data = UnixFS.unmarshal(fetchedNode.data)
    const type = data.type
    if (type === 'directory') {
      dirExporter(fetchedNode, hash, callback)
    }
    if (type === 'file') {
      fileExporter(fetchedNode, hash, false, callback)
    }
  })
  return ee

  function fileExporter (node, name, dir, callback) {
    if (typeof dir === 'function') { callback = dir; dir = {} }
    var rs = new Readable()
    if (node.links.length === 0) {
      const unmarshaledData = UnixFS.unmarshal(node.data)
      ee.emit('file', { stream: rs, path: name, dir: dir })
      rs.push(unmarshaledData.data)
      rs.push(null)
      if (callback) {
        callback()
      }
      return
    } else {
      ee.emit('file', { stream: rs, path: name, dir: dir })
      var init = false
      rs._read = () => {
        if (init) {
          return
        }
        init = true
        async.forEachSeries(node.links, (link, callback) => {
          dagService.get(link.hash, (err, res) => {
            if (err) {
              callback(err)
            }
            var unmarshaledData = UnixFS.unmarshal(res.data)
            rs.push(unmarshaledData.data)
            callback()
          })
        }, (err) => {
          if (err) {
            if (callback) {
              return callback(err)
            }
            return
          }
          rs.push(null)
          if (callback) {
            callback()
          }
          return
        })
      }
    }
  }

  function dirExporter (node, name, callback) {
    var rs = new Readable()
    if (node.links.length === 0) {
      rs.push(node.data)
      rs.push(null)
      ee.emit('file', {stream: rs, path: name})
      if (callback) {
        callback()
      }
      return
    } else {
      async.forEachSeries(node.links, (link, callback) => {
        dagService.get(link.hash, (err, res) => {
          if (err) {
            callback(err)
          }
          var unmarshaledData = UnixFS.unmarshal(res.data)
          if (unmarshaledData.type === 'file') {
            return (fileExporter(res, pathj.join(name, link.name), callback))
          }
          if (unmarshaledData.type === 'directory') {
            return (dirExporter(res, pathj.join(name, link.name), callback))
          }
          callback()
        })
      }, (err) => {
        if (err) {
          if (callback) {
            return callback(err)
          }
          return
        }
        if (callback) {
          callback()
        }
        return
      })
    }
  }
}
