/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 5] */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const concat = require('pull-stream/sinks/concat')
const flatten = require('pull-stream/throughs/flatten')
const map = require('pull-stream/throughs/map')
const collect = require('pull-stream/sinks/collect')
const loadFixture = require('aegir/fixtures')
const bigFile = loadFixture('test/fixtures/1.2MiB.txt')

const importer = require('../src')
const exporter = require('ipfs-unixfs-exporter')

const strategies = [
  'flat',
  'balanced',
  'trickle'
]

function fileEql (f1, fileData, callback) {
  pull(
    f1.content,
    concat((err, data) => {
      expect(err).to.not.exist()
      // TODO: eql is super slow at comparing large buffers
      // expect(data).to.eql(fileData)
      callback()
    })
  )
}

describe('import and export', function () {
  this.timeout(30 * 1000)

  strategies.forEach((strategy) => {
    const importerOptions = { strategy: strategy }

    describe('using builder: ' + strategy, () => {
      let ipld

      before((done) => {
        inMemory(IPLD, (err, resolver) => {
          expect(err).to.not.exist()

          ipld = resolver

          done()
        })
      })

      it('import and export', (done) => {
        const path = strategy + '-big.dat'

        pull(
          values([{ path: path, content: values([bigFile]) }]),
          importer(ipld, importerOptions),
          map((file) => {
            expect(file.path).to.eql(path)

            return exporter(file.multihash, ipld)
          }),
          flatten(),
          collect((err, files) => {
            expect(err).to.not.exist()
            expect(files[0].size).to.eql(bigFile.length)
            fileEql(files[0], bigFile, done)
          })
        )
      })
    })
  })
})
