var debug = require('debug')
var log = debug('importer')
log.err = debug('importer:error')
var fs = require('fs')

exports = module.exports

// Use a layout + chunkers to convert a directory (or file) to the layout format
exports.import = function (options, callback) {
  // options.store -> where to write stuff (typically js-ipfs-repo.datastore, which impls blob-store)
  // options.path -> where to
  // options.recursive -> follow dirs
  // options.chunkers -> obj with chunkers to each type of data, { default: dumb-chunker }

  var pathStats = fs.statSync(options.path)
  if (pathStats.isFile()) {

  } else if (pathStats.isDir() && options.recursive) {

  } else {
    return callback(new Error('recursive must be true to add a directory'))
  }
}

exports.export = function () {
}
