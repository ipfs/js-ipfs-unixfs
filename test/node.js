/* eslint-env mocha */
'use strict'

const ncp = require('ncp').ncp
const rimraf = require('rimraf')
const path = require('path')
const IPFSRepo = require('ipfs-repo')
const Store = require('fs-pull-blob-store')
const mkdirp = require('mkdirp')
const series = require('async/series')

describe('core', () => {
  const repoExample = path.join(process.cwd(), '/test/repo-example')
  const repoTests = path.join(process.cwd(), '/test/repo-tests' + Date.now())

  before((done) => {
    ncp(repoExample, repoTests, (err) => {
      process.env.IPFS_PATH = repoTests
      done(err)
    })
  })

  before((done) => {
    const paths = [
      'test-data/dir-nested/dir-another',
      'test-data/dir-nested/level-1/level-2'
    ]

    series(paths.map((p) => (cb) => {
      mkdirp(path.join(__dirname, p), cb)
    }), done)
  })

  after((done) => {
    rimraf(repoTests, done)
  })

  const repo = new IPFSRepo(repoTests, {stores: Store})
  require('./test-exporter')(repo)
  require('./test-importer')(repo)
  require('./test-fixed-size-chunker')
})
