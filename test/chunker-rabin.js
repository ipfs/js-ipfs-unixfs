/* eslint-env mocha */
'use strict'

const chunker = require('./../src/chunker/rabin')
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const pull = require('pull-stream')
const loadFixture = require('aegir/fixtures')

const rawFile = loadFixture('test/fixtures/1MiB.txt')

describe('chunker: rabin', function () {
  this.timeout(30000)

  it('chunks non flat buffers', (done) => {
    const b1 = Buffer.alloc(2 * 256)
    const b2 = Buffer.alloc(1 * 256)
    const b3 = Buffer.alloc(5 * 256)

    b1.fill('a')
    b2.fill('b')
    b3.fill('c')

    pull(
      pull.values([b1, b2, b3]),
      chunker({minChunkSize: 48, avgChunkSize: 96, maxChunkSize: 192}),
      pull.collect((err, chunks) => {
        expect(err).to.not.exist()
        chunks.forEach((chunk) => {
          expect(chunk).to.have.length.gte(48)
          expect(chunk).to.have.length.lte(192)
        })
        done()
      })
    )
  })

  it('256 KiB avg chunks of non scalar filesize', (done) => {
    const KiB256 = 262144
    let file = Buffer.concat([rawFile, Buffer.from('hello')])
    const opts = {
      minChunkSize: KiB256 / 3,
      avgChunkSize: KiB256,
      maxChunkSize: KiB256 + (KiB256 / 2)
    }
    pull(
      pull.values([file]),
      chunker(opts),
      pull.collect((err, chunks) => {
        expect(err).to.not.exist()

        chunks.forEach((chunk) => {
          expect(chunk).to.have.length.gte(opts.minChunkSize)
          expect(chunk).to.have.length.lte(opts.maxChunkSize)
        })

        done()
      })
    )
  })
})
