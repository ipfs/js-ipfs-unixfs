/* eslint-env mocha */
/* global self */
'use strict'

const Store = require('idb-pull-blob-store')
const IPFSRepo = require('ipfs-repo')
const repoContext = require.context('buffer!./repo-example', true)
const pull = require('pull-stream')

const idb = self.indexedDB ||
  self.mozIndexedDB ||
  self.webkitIndexedDB ||
  self.msIndexedDB

idb.deleteDatabase('ipfs')
idb.deleteDatabase('ipfs/blocks')

describe('IPFS data importing tests on the Browser', function () {
  before(function (done) {
    this.timeout(23000)
    const repoData = []
    repoContext.keys().forEach(function (key) {
      repoData.push({
        key: key.replace('./', ''),
        value: repoContext(key)
      })
    })

    const mainBlob = new Store('ipfs')
    const blocksBlob = new Store('ipfs/blocks')

    pull(
      pull.values(repoData),
      pull.asyncMap((file, cb) => {
        if (file.key.indexOf('datastore/') === 0) {
          return cb()
        }

        const blocks = file.key.indexOf('blocks/') === 0
        const blob = blocks ? blocksBlob : mainBlob
        const key = blocks ? file.key.replace(/^blocks\//, '') : file.key

        pull(
          pull.values([file.value]),
          blob.write(key, cb)
        )
      }),
      pull.onEnd(done)
    )
  })

  // create the repo constant to be used in the import a small buffer test
  const repo = new IPFSRepo('ipfs', {stores: Store})

  require('./test-flat-builder')
  require('./test-balanced-builder')
  require('./test-trickle-builder')
  require('./test-fixed-size-chunker')
  require('./test-exporter')(repo)
  require('./test-importer')(repo)
  require('./test-import-export')(repo)
  require('./test-hash-parity-with-go-ipfs')(repo)
  require('./test-nested-dir-import-export')(repo)
})
