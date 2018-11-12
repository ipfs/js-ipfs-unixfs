'use strict'

const {
  util: {
    cid
  }
} = require('ipld-dag-pb')

const defaultOptions = {
  cidVersion: 0,
  hashAlg: 'sha2-256',
  codec: 'dag-pb'
}

const persist = (node, ipld, options, callback) => {
  let cidVersion = options.cidVersion || defaultOptions.cidVersion
  let hashAlg = options.hashAlg || defaultOptions.hashAlg
  let codec = options.codec || defaultOptions.codec

  if (Buffer.isBuffer(node)) {
    cidVersion = 1
    codec = 'raw'
  }

  if (hashAlg !== 'sha2-256') {
    cidVersion = 1
  }

  if (options.onlyHash) {
    return cid(node, {
      version: cidVersion,
      hashAlg: hashAlg
    }, (err, cid) => {
      callback(err, {
        cid,
        node
      })
    })
  }

  ipld.put(node, {
    version: cidVersion,
    hashAlg: hashAlg,
    format: codec
  }, (error, cid) => {
    callback(error, {
      cid,
      node
    })
  })
}

module.exports = persist
