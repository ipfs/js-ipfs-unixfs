'use strict'

const debug = require('debug')
const log = debug('unixfs')
log.err = debug('unixfs:error')
const isIPFS = require('is-ipfs')
const UnixFS = require('ipfs-unixfs')
const series = require('run-series')
const Readable = require('readable-stream').Readable
const pathj = require('path')
const util = require('util')
const fieldtrip = require('field-trip')
const cleanMultihash = require('./clean-multihash')

exports = module.exports = Exporter

util.inherits(Exporter, Readable)

function Exporter (hash, dagService, options) {
  if (!(this instanceof Exporter)) {
    return new Exporter(hash, dagService, options)
  }

  // Sanitize hash
  if (!isIPFS.multihash(hash)) {
    throw new Error('not valid multihash')
  }
  hash = cleanMultihash(hash)

  Readable.call(this, { objectMode: true })

  this.options = options || {}

  this._read = (n) => {}

  let fileExporter = (node, name, done) => {
    if (!done) {
      throw new Error('done must be set')
    }

    const contentRS = new Readable()
    contentRS._read = () => {}

    // Logic to export a single (possibly chunked) unixfs file.
    if (node.links.length === 0) {
      const unmarshaledData = UnixFS.unmarshal(node.data)
      contentRS.push(unmarshaledData.data)
      contentRS.push(null)
      this.push({ content: contentRS, path: name })
      done()
    } else {
      const array = node.links.map((link) => {
        return (cb) => {
          dagService.get(link.hash, (err, res) => {
            if (err) {
              return cb(err)
            }
            var unmarshaledData = UnixFS.unmarshal(res.data)
            contentRS.push(unmarshaledData.data)
            cb()
          })
        }
      })
      series(array, (err) => {
        if (err) {
          return contentRS.emit('error', err)
        }
        contentRS.push(null)
      })
      this.push({ content: contentRS, path: name })
      done()
    }
  }

  // Logic to export a unixfs directory.
  let dirExporter = (node, name, add, done) => {
    if (!add) {
      throw new Error('add must be set')
    }
    if (!done) {
      throw new Error('done must be set')
    }

    this.push({content: null, path: name})

    // Directory has links
    if (node.links.length > 0) {
      node.links.forEach((link) => {
        add({ path: pathj.join(name, link.name), hash: link.hash })
      })
    }
    done()
  }

  // Traverse the DAG asynchronously
  fieldtrip([{path: hash, hash: hash}], visit.bind(this), (err) => {
    if (err) {
      return this.emit('error', err)
    }
    this.push(null)
  })

  // Visit function: called once per node in the exported graph
  function visit (item, add, done) {
    dagService.get(item.hash, (err, node) => {
      if (err) {
        return this.emit('error', err)
      }

      const data = UnixFS.unmarshal(node.data)
      const type = data.type

      if (type === 'directory') {
        dirExporter(node, item.path, add, done)
      }

      if (type === 'file') {
        fileExporter(node, item.path, done)
      }
    })
  }

  return this
}
