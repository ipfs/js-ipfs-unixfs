/* eslint-env mocha */
'use strict'

const fs = require('fs')
const ncp = require('ncp').ncp
const rimraf = require('rimraf')
const expect = require('chai').expect
const path = require('path')
const IPFSRepo = require('ipfs-repo')
const fsbs = require('fs-blob-store')

describe('core', () => {
  const repoExample = path.join(process.cwd(), '/test/repo-example')
  const repoTests = path.join(process.cwd(), '/test/repo-tests' + Date.now())

  before((done) => {
    ncp(repoExample, repoTests, (err) => {
      process.env.IPFS_PATH = repoTests
      expect(err).to.equal(null)
      done()
    })
  })

  before((done) => {
    fs.stat(path.join(__dirname, '/test-data/dir-nested/dir-another'), (err, exists) => {
      if (err) {
        fs.mkdirSync(path.join(__dirname, '/test-data/dir-nested/dir-another'))
      }
    })

    fs.stat(path.join(__dirname, '/test-data/dir-nested/level-1/level-2'), (err, exists) => {
      if (err) {
        fs.mkdirSync(path.join(__dirname, '/test-data/dir-nested/level-1/level-2'))
      }
      done()
    })
  })

  after((done) => {
    rimraf(repoTests, (err) => {
      expect(err).to.equal(null)
      done()
    })
  })

  const repo = new IPFSRepo(repoTests, {stores: fsbs})
  require('./test-exporter')(repo)
  require('./test-importer')(repo)
  require('./test-fixed-size-chunker')
})
