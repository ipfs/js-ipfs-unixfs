/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const BlockService = require('ipfs-block-service')
const IPLDResolver = require('ipld-resolver')
const pull = require('pull-stream')

const randomByteStream = require('./helpers/finite-pseudorandom-byte-stream')
const unixFSEngine = require('./../')
const exporter = unixFSEngine.exporter

const strategies = [
  'flat',
  'balanced',
  'trickle'
]

module.exports = (repo) => {
  let bigFile
  strategies.forEach((strategy) => {
    const importerOptions = {
      strategy: strategy
    }

    describe('import export using ' + strategy + ' builder strategy', () => {
      let ipldResolver

      before(() => {
        const bs = new BlockService(repo)
        ipldResolver = new IPLDResolver(bs)
      })

      before((done) => {
        if (bigFile) {
          return done()
        }

        pull(
          randomByteStream(50000000, 8372),
          pull.collect((err, buffers) => {
            if (err) {
              done(err)
            } else {
              bigFile = buffers
              done()
            }
          })
        )
      })

      it('import and export', (done) => {
        const path = strategy + '-big.dat'
        pull(
          pull.values([{
            path: path,
            content: pull.values(bigFile)
          }]),
          unixFSEngine.importer(ipldResolver, importerOptions),
          pull.map((file) => {
            expect(file.path).to.be.eql(path)

            return exporter(file.multihash, ipldResolver)
          }),
          pull.flatten(),
          pull.collect((err, files) => {
            expect(err).to.not.exist
            expect(files[0].size).to.be.eql(bigFile.reduce(reduceLength, 0))
            fileEql(files[0], Buffer.concat(bigFile), done)
          })
        )
      })
    })
  })
}

function fileEql (f1, f2, done) {
  pull(
    f1.content,
    pull.collect((err, data) => {
      if (err) {
        return done(err)
      }

      try {
        if (f2) {
          expect(Buffer.concat(data)).to.be.eql(f2)
        } else {
          expect(data).to.exist
        }
      } catch (err) {
        return done(err)
      }
      done()
    })
  )
}

function reduceLength (acc, chunk) {
  return acc + chunk.length
}
