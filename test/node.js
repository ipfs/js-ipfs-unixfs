/* eslint-env mocha */
'use strict'

const ncp = require('ncp').ncp
const rimraf = require('rimraf')
const path = require('path')
const IPFSRepo = require('ipfs-repo')
const mkdirp = require('mkdirp')
const series = require('async/series')

describe('IPFS UnixFS Engine', () => {
  const repoExample = path.join(process.cwd(), '/test/test-repo')
  const repoTests = path.join(process.cwd(), '/test/repo-tests' + Date.now())

  const repo = new IPFSRepo(repoTests)

  before((done) => {
    const paths = [
      'test-data/dir-nested/dir-another',
      'test-data/dir-nested/level-1/level-2'
    ]
    process.env.IPFS_PATH = repoTests
    series([
      (cb) => ncp(repoExample, repoTests, cb),
      (cb) => repo.open(cb),
      (cb) => series(paths.map((p) => (cb) => {
        mkdirp(path.join(__dirname, p), cb)
      }), cb)
    ], done)
  })

  after((done) => {
    series([
      (cb) => repo.close(cb),
      (cb) => rimraf(repoTests, cb)
    ], done)
  })

  require('./test-builder')(repo)
  require('./test-flat-builder')
  require('./test-balanced-builder')
  require('./test-trickle-builder')
  require('./test-fixed-size-chunker')
  require('./test-consumable-buffer')
  require('./test-consumable-hash')
  require('./test-hamt')
  require('./test-exporter')(repo)
  require('./test-export-subtree')(repo)
  require('./test-importer')(repo)
  require('./test-importer-flush')(repo)
  require('./test-import-export')(repo)
  require('./test-hash-parity-with-go-ipfs')(repo)
  require('./test-nested-dir-import-export')(repo)
  require('./test-dirbuilder-sharding')(repo)
  require('./test-dag-api')
  require('./test-builder-only-hash')(repo)
})
