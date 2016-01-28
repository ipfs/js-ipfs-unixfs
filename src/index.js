var debug = require('debug')
var log = debug('importer')
log.err = debug('importer:error')
var fs = require('fs')
var mDAG = require('ipfs-merkle-dag')
var FixedSizeChunker = require('./chunker-fixed-size')
var through2 = require('through2')

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
        var node = new mDAG.DAGNode(chunk)
        var block = new mDAG.Block(node.marshal())
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
        // log('links', links)
        if (links.length === 1) {
          callback(null, links[0]) && cb()
        } else {
          var parentNode = new mDAG.DAGNode()
          links.forEach(function (l) {
            var link = new mDAG.DAGLink(l.Name, l.Size, l.Hash)
            parentNode.addNodeLink('', link)
          })
          var block = new mDAG.Block(parentNode.marshal())
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
        }
      }))
  } else if (pathStats.isDir() && options.recursive) {

  } else {
    return callback(new Error('recursive must be true to add a directory'))
  }
}

exports.export = function () {
}
