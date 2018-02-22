/* eslint-env mocha */
'use strict'

const ncp = require('ncp').ncp
const rimraf = require('rimraf')
const path = require('path')
const os = require('os')
const IPFSRepo = require('ipfs-repo')
const mkdirp = require('mkdirp')
const series = require('async/series')

describe('IPFS UnixFS Engine', () => {
  const repoExample = path.join(process.cwd(), '/test/test-repo')
  const repoTests = path.join(os.tmpdir(), '/unixfs-tests-' + Date.now())

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
  require('./builder-dir-sharding')(repo)

  // Importer
  require('./importer')(repo)
  require('./importer-flush')(repo)

  // Exporter
  require('./exporter')(repo)
  require('./exporter-subtree')(repo)

  // Reader
  require('./reader')(repo)

  // Other
  require('./import-export')(repo)
  require('./import-export-nested-dir')(repo)
  require('./hash-parity-with-go-ipfs')(repo)
  require('./with-dag-api')
})
