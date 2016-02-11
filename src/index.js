const debug = require('debug')
const log = debug('importer')
log.err = debug('importer:error')
const fs = require('fs')
const mDAG = require('ipfs-merkle-dag')
const FixedSizeChunker = require('./chunker-fixed-size')
const through2 = require('through2')
const UnixFS = require('ipfs-unixfs')

exports = module.exports

const CHUNK_SIZE = 262144

// Use a layout + chunkers to convert a directory (or file) to the layout format
exports.import = (options, callback) => {
  // options.path -> what to import
  // options.recursive -> follow dirs
  // options.chunkers -> obj with chunkers to each type of data, { default: dumb-chunker }
  // options.dag-service-> instance of block service
  const dagService = options.dagService

  const stats = fs.statSync(options.path)
  if (stats.isFile()) {
    fileImporter(options, callback)
  } else if (stats.isDir() && options.recursive) {
    dirImporter(options.path, callback)
  } else {
    return callback(new Error('recursive must be true to add a directory'))
  }

  function fileImporter (path, callback) {
    if (stats.size > CHUNK_SIZE) {
      const links = [] // { Hash: , Size: , Name: }

      fs.createReadStream(options.path)
        .pipe(new FixedSizeChunker(CHUNK_SIZE))
        .pipe(through2((chunk, enc, cb) => {
          const raw = new UnixFS('raw', chunk)

          const node = new mDAG.DAGNode(raw.marshal())

          dagService.add(node, function (err) {
            if (err) {
              return log.err(err)
            }
            links.push({
              Hash: node.multihash(),
              Size: node.size(),
              Name: ''
            })

            cb()
          })
        }, (cb) => {
          const file = new UnixFS('file')
          const parentNode = new mDAG.DAGNode()

          links.forEach((l) => {
            file.addBlockSize(l.Size)
            const link = new mDAG.DAGLink(l.Name, l.Size, l.Hash)
            parentNode.addRawLink(link)
          })

          parentNode.data = file.marshal()
          dagService.add(parentNode, (err) => {
            if (err) {
              return log.err(err)
            }

            const pathSplit = options.path.split('/')
            const fileName = pathSplit[pathSplit.length - 1]

            callback(null, {
              Hash: parentNode.multihash(),
              Size: parentNode.size(),
              Name: fileName
            }) && cb()
          })
          // }
        }))
    } else {
      // create just one file node with the data directly
      const fileUnixFS = new UnixFS('file', fs.readFileSync(options.path))
      const fileNode = new mDAG.DAGNode(fileUnixFS.marshal())

      dagService.add(fileNode, (err) => {
        if (err) {
          return log.err(err)
        }

        const pathSplit = options.path.split('/')
        const fileName = pathSplit[pathSplit.length - 1]

        callback(null, {
          Hash: fileNode.multihash(),
          Size: fileNode.size(),
          Name: fileName
        })
      })
    }
  }

  function dirImporter (path) {}
  // function bufferImporter (path) {}
  // function streamImporter (path) {}
}

exports.export = function () {
}
