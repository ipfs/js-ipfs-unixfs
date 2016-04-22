/* eslint-env mocha */
'use strict'

const fs = require('fs')
const ncp = require('ncp').ncp
const rimraf = require('rimraf')
const expect = require('chai').expect
const path = require('path')
const IPFSRepo = require('ipfs-repo')

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

  after((done) => {
    rimraf(repoTests, (err) => {
      expect(err).to.equal(null)
      done()
    })
  })

  const fsb = require ('fs-blob-store')
  const repo = new IPFSRepo(repoTests, {stores: fsb})
  const tests = fs.readdirSync(__dirname)
  require('./test-exporter')(repo)
  require('./test-importer')(repo)
  require('./test-fixed-size-chunker')
})
