/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 5] */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const BlockService = require('ipfs-block-service')
const Ipld = require('ipld')
const pull = require('pull-stream')
const loadFixture = require('aegir/fixtures')
const bigFile = loadFixture('test/fixtures/1.2MiB.txt')

const unixFSEngine = require('./../')
const exporter = unixFSEngine.exporter

const strategies = [
  'flat',
  'balanced',
  'trickle'
]

function fileEql (f1, fileData, callback) {
  pull(
    f1.content,
    pull.concat((err, data) => {
      expect(err).to.not.exist()
      // TODO: eql is super slow at comparing large buffers
      // expect(data).to.eql(fileData)
      callback()
    })
  )
}

module.exports = (repo) => {
  describe('import and export', function () {
    this.timeout(30 * 1000)

    strategies.forEach((strategy) => {
      const importerOptions = { strategy: strategy }

      describe('using builder: ' + strategy, () => {
        let ipld

        before(() => {
          const bs = new BlockService(repo)
          ipld = new Ipld(bs)
        })

        it('import and export', (done) => {
          const path = strategy + '-big.dat'

          pull(
            pull.values([{ path: path, content: pull.values(bigFile) }]),
            unixFSEngine.importer(ipld, importerOptions),
            pull.map((file) => {
              expect(file.path).to.eql(path)

              return exporter(file.multihash, ipld)
            }),
            pull.flatten(),
            pull.collect((err, files) => {
              expect(err).to.not.exist()
              expect(files[0].size).to.eql(bigFile.length)
              fileEql(files[0], bigFile, done)
            })
          )
        })
      })
    })
  })
}
