'use strict'

const debug = require('debug')
const log = debug('exporter')
log.err = debug('exporter:error')
const UnixFS = require('ipfs-unixfs')
const series = require('run-series')
const async = require('async')
const Readable = require('readable-stream').Readable
const pathj = require('path')
const util = require('util')

exports = module.exports = Exporter

util.inherits(Exporter, Readable)

function Exporter (hash, dagService, options) {
  if (!(this instanceof Exporter)) {
    return new Exporter(hash, dagService, options)
  }

  Readable.call(this, { objectMode: true })

  this.options = options || {}

  this._read = (n) => {}

  let fileExporter = (node, name, callback) => {
    let init

    if (!callback) { callback = function noop () {} }

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
      callback()
      return
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
                cb(err)
              }
              var unmarshaledData = UnixFS.unmarshal(res.data)
              rs.push(unmarshaledData.data)
              cb()
            })
          }
        })
        series(array, (err, res) => {
          if (err) {
            callback()
            return
          }
          rs.push(null)
          callback()
          return
        })
      }
      this.push({ content: rs, path: name })
      callback()
      return
    }
  }

  let dirExporter = (node, name, callback) => {
    let init

    if (!callback) { callback = function noop () {} }

    var rs = new Readable()
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
      callback()
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
          callback()
          return
        }
        callback()
        return
      })
    }
  }

  dagService.get(hash, (err, fetchedNode) => {
    if (err) {
      this.emit('error', err)
      return
    }
    const data = UnixFS.unmarshal(fetchedNode.data)
    const type = data.type

    if (type === 'directory') {
      dirExporter(fetchedNode, hash)
    }
    if (type === 'file') {
      fileExporter(fetchedNode, hash)
    }
  })

  return this
}
