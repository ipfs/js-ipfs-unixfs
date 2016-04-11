/* globals describe, before, after */

'use strict'

const fs = require('fs')
const ncp = require('ncp').ncp
const rimraf = require('rimraf')
const expect = require('chai').expect
const path = require('path')

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

  const tests = fs.readdirSync(__dirname)
  tests.filter((file) => {
    if (file === 'index.js' ||
        file === 'browser.js' ||
        file === 'test-data' ||
        file === 'repo-example' ||
        file === 'buffer-test.js' ||
        file.indexOf('repo-tests') > -1) {
      return false
    }

    return true
  }).forEach((file) => {
    require('./' + file)
  })
})
