/* eslint-env mocha */
/* global self */
'use strict'

const series = require('async/series')
const IPFSRepo = require('ipfs-repo')

const idb = self.indexedDB ||
  self.mozIndexedDB ||
  self.webkitIndexedDB ||
  self.msIndexedDB

idb.deleteDatabase('ipfs')
idb.deleteDatabase('ipfs/blocks')

describe('IPFS data importing tests on the Browser', function () {
  const repo = new IPFSRepo('ipfs')

  before((done) => {
    series([
      (cb) => repo.init({}, cb),
      (cb) => repo.open(cb)
    ], done)
  })

  after((done) => {
    series([
      (cb) => repo.close(cb),
      (cb) => {
        idb.deleteDatabase('ipfs')
        idb.deleteDatabase('ipfs/blocks')
        cb()
      }
    ], done)
  })

  require('./test-flat-builder')
  require('./test-balanced-builder')
  require('./test-trickle-builder')
  require('./test-fixed-size-chunker')

  // relies on data in the repo
  // require('./test-exporter')(repo)

  require('./test-importer')(repo)
  require('./test-import-export')(repo)
  require('./test-hash-parity-with-go-ipfs')(repo)
  require('./test-nested-dir-import-export')(repo)
})
