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

  // HAMT
  require('./hamt')
  require('./hamt-consumable-buffer')
  require('./hamt-consumable-hash')

  // Chunkers
  require('./chunker-fixed-size')

  // Graph Builders
  require('./builder')(repo)
  require('./builder-flat')
  require('./builder-balanced')
  require('./builder-trickle-dag')
  require('./builder-only-hash')(repo)
  // TODO: make these tests not require data on the repo
  // require('./builder-dir-sharding')(repo)

  // Importer
  require('./importer')(repo)
  require('./importer-flush')(repo)

  // Exporter
  // TODO: make these tests not require data on the repo
  // require('./exporter')(repo)
  // require('./exporter-subtree')(repo)

  // Other
  require('./import-export')(repo)
  require('./import-export-nested-dir')(repo)
  require('./hash-parity-with-go-ipfs')(repo)
  // require('./with-dag-api')
})
