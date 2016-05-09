'use strict'

const debug = require('debug')
const log = debug('exporter')
log.err = debug('exporter:error')
const UnixFS = require('ipfs-unixfs')
const async = require('async')
const events = require('events')
const Readable = require('readable-stream').Readable
const pathj = require('path')

exports = module.exports = exporter

function exporter (hash, dagService, options, callback) {
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
    let init

    if (typeof dir === 'function') { callback = dir; dir = {} }
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
      ee.emit('file', { stream: rs, path: name, dir: dir })
      if (callback) {
        callback()
      }
      return
    } else {
      init = false
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
      ee.emit('file', { stream: rs, path: name, dir: dir })
    }
  }

  function dirExporter (node, name, callback) {
    let init

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
