var debug = require('debug')
var log = debug('importer')
log.err = debug('importer:error')
var fs = require('fs')
var mDAG = require('ipfs-merkle-dag')
var Block = require('ipfs-blocks').Block
var FixedSizeChunker = require('./chunker-fixed-size')
var through2 = require('through2')
var UnixFS = require('ipfs-unixfs')

exports = module.exports

// Use a layout + chunkers to convert a directory (or file) to the layout format
exports.import = function (options, callback) {
  // options.store -> where to write stuff (typically js-ipfs-repo.datastore, which impls blob-store)
  // options.path -> where to
  // options.recursive -> follow dirs
  // options.chunkers -> obj with chunkers to each type of data, { default: dumb-chunker }
  // options.blockService -> instance of block service
  var bs = options.blockService

  var pathStats = fs.statSync(options.path)
  if (pathStats.isFile()) {
    var links = [] // { Hash: , Size: , Name: }

    fs.createReadStream(options.path)
      .pipe(new FixedSizeChunker(262144))
      .pipe(through2(function transform (chunk, enc, cb) {
        // chunk is a 256KiB, create a MerkleDAG node with it
        // store it and flush it
        // store the hash and size

        var raw = new UnixFS('raw', chunk)
        var node = new mDAG.DAGNode(raw.marshal())
        var block = new Block(node.marshal())
        bs.addBlock(block, function (err) {
          if (err) {
            return log.err(err)
          }
          links.push({
            Hash: block.key,
            Size: node.size(),
            Name: ''
          })
          cb()
        })
      }, function flush (cb) {
        // create the MerkleDAG node that points to all the chunks (shift, not pop)
        // if there is only one, leave it
        // if (links.length === 1) {
        //  callback(null, links[0]) && cb()
        // } else {
        var file = new UnixFS('file')
        var parentNode = new mDAG.DAGNode()
        links.forEach(function (l) {
          file.addBlockSize(l.Size)
          var link = new mDAG.DAGLink(l.Name, l.Size, l.Hash)
          parentNode.addRawLink(link)
        })
        parentNode.data = file.marshal()
        var block = new Block(parentNode.marshal())
        bs.addBlock(block, function (err) {
          if (err) {
            return log.err(err)
          }

          callback(null, {
            Hash: block.key,
            Size: parentNode.size(),
            Name: ''
          }) && cb()
        })
        // }
      }))
  } else if (pathStats.isDir() && options.recursive) {

  } else {
    return callback(new Error('recursive must be true to add a directory'))
  }
}

exports.export = function () {
}
