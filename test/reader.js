/* eslint-env mocha */
'use strict'

const reader = require('../src').reader

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const BlockService = require('ipfs-block-service')
const Ipld = require('ipld')
const pull = require('pull-stream')
const values = require('pull-stream/sources/values')
const collect = require('pull-stream/sinks/collect')
const importer = require('./../src').importer

module.exports = (repo) => {
  describe('reader', function () {
    let ipld

    function addAndReadTestFile ({file, begin, end, strategy = 'balanced'}, cb) {
      pull(
        values([{
          path: '/foo',
          content: file
        }]),
        importer(ipld, {
          strategy
        }),
        collect((error, nodes) => {
          expect(error).to.not.exist()
          expect(nodes.length).to.be.eql(1)

          pull(
            reader(nodes[0].multihash, ipld, begin, end),
            collect((error, results) => {
              cb(error, Buffer.concat(results))
            })
          )
        })
      )
    }

    function checkBytesThatSpanBlocks (strategy, cb) {
      const bytesInABlock = 262144
      const bytes = Buffer.alloc(bytesInABlock + 100, 0)

      bytes[bytesInABlock - 1] = 1
      bytes[bytesInABlock] = 2
      bytes[bytesInABlock + 1] = 3

      addAndReadTestFile({
        file: bytes,
        begin: bytesInABlock - 1,
        end: bytesInABlock + 2,
        strategy
      }, (error, data) => {
        if (error) {
          return cb(error)
        }

        expect(data).to.deep.equal(Buffer.from([1, 2, 3]))

        cb()
      })
    }

    before(() => {
      const bs = new BlockService(repo)
      ipld = new Ipld(bs)
    })

    it('fails on invalid path', (done) => {
      pull(
        reader('?!?', ipld),
        collect((error) => {
          expect(error.message).to.contain("Path '?!?' was invalid: Non-base58 character")

          done()
        })
      )
    })

    it('fails on non-file', (done) => {
      addAndReadTestFile({
        file: undefined
      }, (error) => {
        expect(error.message).to.contain('was not a file')

        done()
      })
    })

    it('fails on file with no links', (done) => {
      addAndReadTestFile({
        file: Buffer.from([])
      }, (error) => {
        expect(error.message).to.contain('had no links')

        done()
      })
    })

    it('reads bytes with a begin', (done) => {
      addAndReadTestFile({
        file: Buffer.from([0, 1, 2, 3]),
        begin: 1
      }, (error, data) => {
        if (error) {
          return done(error)
        }

        expect(data).to.deep.equal(Buffer.from([1, 2, 3]))

        done()
      })
    })

    it('reads bytes with a negative begin', (done) => {
      addAndReadTestFile({
        file: Buffer.from([0, 1, 2, 3]),
        begin: -1
      }, (error, data) => {
        if (error) {
          return done(error)
        }

        expect(data).to.deep.equal(Buffer.from([3]))

        done()
      })
    })

    it('reads bytes with an end', (done) => {
      addAndReadTestFile({
        file: Buffer.from([0, 1, 2, 3]),
        being: 0,
        end: 1
      }, (error, data) => {
        if (error) {
          return done(error)
        }

        expect(data).to.deep.equal(Buffer.from([0]))

        done()
      })
    })

    it('reads bytes with a negative end', (done) => {
      addAndReadTestFile({
        file: Buffer.from([0, 1, 2, 3, 4]),
        begin: 2,
        end: -1
      }, (error, data) => {
        if (error) {
          return done(error)
        }

        expect(data).to.deep.equal(Buffer.from([2, 3]))

        done()
      })
    })

    it('reads bytes with an begin and an end', (done) => {
      addAndReadTestFile({
        file: Buffer.from([0, 1, 2, 3, 4]),
        begin: 1,
        end: 4
      }, (error, data) => {
        if (error) {
          return done(error)
        }

        expect(data).to.deep.equal(Buffer.from([1, 2, 3]))

        done()
      })
    })

    it('reads bytes with a negative begin and a negative end that point to the same byte', (done) => {
      addAndReadTestFile({
        file: Buffer.from([0, 1, 2, 3, 4]),
        begin: -1,
        end: -1
      }, (error, data) => {
        if (error) {
          return done(error)
        }

        expect(data).to.deep.equal(Buffer.from([]))

        done()
      })
    })

    it('reads bytes with a negative begin and a negative end', (done) => {
      addAndReadTestFile({
        file: Buffer.from([0, 1, 2, 3, 4]),
        begin: -2,
        end: -1
      }, (error, data) => {
        if (error) {
          return done(error)
        }

        expect(data).to.deep.equal(Buffer.from([3]))

        done()
      })
    })

    it('reads bytes to the end of the file when end is larger than the file', (done) => {
      addAndReadTestFile({
        file: Buffer.from([0, 1, 2, 3]),
        begin: 0,
        end: 100
      }, (error, data) => {
        if (error) {
          return done(error)
        }

        expect(data).to.deep.equal(Buffer.from([0, 1, 2, 3]))

        done()
      })
    })

    it('reads bytes with an offset and a length that span blocks using balanced layout', (done) => {
      checkBytesThatSpanBlocks('balanced', done)
    })

    it('reads bytes with an offset and a length that span blocks using flat layout', (done) => {
      checkBytesThatSpanBlocks('flat', done)
    })

    it('reads bytes with an offset and a length that span blocks using trickle layout', (done) => {
      checkBytesThatSpanBlocks('trickle', done)
    })
  })
}
