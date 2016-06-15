'use strict'

const debug = require('debug')
const log = debug('exporter')
log.err = debug('exporter:error')
const isIPFS = require('is-ipfs')
const bs58 = require('bs58')
const UnixFS = require('ipfs-unixfs')
const series = require('run-series')
const Readable = require('readable-stream').Readable
const pathj = require('path')
const util = require('util')
const fieldtrip = require('field-trip')

exports = module.exports = Exporter

util.inherits(Exporter, Readable)

function Exporter (hash, dagService, options) {
  if (!(this instanceof Exporter)) {
    return new Exporter(hash, dagService, options)
  }

  // Sanitize hash.
  if (!isIPFS.multihash(hash)) {
    throw new Error('not valid multihash')
  }
  if (Buffer.isBuffer(hash)) {
    hash = bs58.encode(hash)
  }

  Readable.call(this, { objectMode: true })

  this.options = options || {}

  this._read = (n) => {}

  let fileExporter = (node, name, done) => {
    let init

    if (!done) throw new Error('done must be set')

    // Logic to export a single (possibly chunked) unixfs file.
    var rs = new Readable()
    if (node.links.length === 0) {
      const unmarshaledData = UnixFS.unmarshal(node.data)
      init = false
      rs._read = () => {
        if (init) {
          return
        }
        init = true
        rs.push(unmarshaledData.data)
        rs.push(null)
      }
      this.push({ content: rs, path: name })
      done()
    } else {
      init = false
      rs._read = () => {
        if (init) {
          return
        }
        init = true

        const array = node.links.map((link) => {
          return (cb) => {
            dagService.get(link.hash, (err, res) => {
              if (err) {
                return cb(err)
              }
              var unmarshaledData = UnixFS.unmarshal(res.data)
              rs.push(unmarshaledData.data)
              cb()
            })
          }
        })
        series(array, (err, res) => {
          if (err) {
            rs.emit('error', err)
            return
          }
          rs.push(null)
          return
        })
      }
      this.push({ content: rs, path: name })
      done()
    }
  }

  // Logic to export a unixfs directory.
  let dirExporter = (node, name, add, done) => {
    let init

    if (!add) throw new Error('add must be set')
    if (!done) throw new Error('done must be set')

    var rs = new Readable()

    // Directory has no links
    if (node.links.length === 0) {
      init = false
      rs._read = () => {
        if (init) {
          return
        }
        init = true
        rs.push(node.data)
        rs.push(null)
      }
      this.push({content: null, path: name})
      done()
    } else {
      node.links.forEach((link) => {
        add({ path: pathj.join(name, link.name), hash: link.hash })
      })
      done()
    }
  }

  // Traverse the DAG asynchronously
  var self = this
  fieldtrip([{ path: hash, hash: hash }], visit, (err) => {
    if (err) {
      self.emit('error', err)
      return
    }
    self.push(null)
  })

  // Visit function: called once per node in the exported graph
  function visit (item, add, done) {
    dagService.get(item.hash, (err, fetchedNode) => {
      if (err) {
        self.emit('error', err)
        return
      }

      const data = UnixFS.unmarshal(fetchedNode.data)
      const type = data.type

      if (type === 'directory') {
        dirExporter(fetchedNode, item.path, add, done)
      }

      if (type === 'file') {
        fileExporter(fetchedNode, item.path, done)
      }
    })
  }

  return this
}
