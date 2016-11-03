/* eslint-env mocha */
'use strict'

const chunker = require('./../src/chunker/fixed-size')
const expect = require('chai').expect
const pull = require('pull-stream')
const loadFixture = require('aegir/fixtures')

const rawFile = loadFixture(__dirname, 'fixtures/1MiB.txt')

describe('chunker: fixed size', () => {
  it('chunks non flat buffers', (done) => {
    const b1 = new Buffer(2 * 256)
    const b2 = new Buffer(1 * 256)
    const b3 = new Buffer(5 * 256)

    b1.fill('a')
    b2.fill('b')
    b3.fill('c')

    pull(
      pull.values([b1, b2, b3]),
      chunker(256),
      pull.collect((err, chunks) => {
        expect(err).to.not.exists
        expect(chunks).to.have.length(8)
        chunks.forEach((chunk) => {
          expect(chunk).to.have.length(256)
        })
        done()
      })
    )
  })

  it('256 Bytes chunks', (done) => {
    pull(
      pull.infinite(() => Buffer([1])),
      pull.take(256 * 12),
      chunker(256),
      pull.collect((err, chunks) => {
        expect(err).to.not.exists
        expect(chunks).to.have.length(12)
        chunks.forEach((chunk) => {
          expect(chunk).to.have.length(256)
        })
        done()
      })
    )
  })

  it('256 KiB chunks', (done) => {
    const KiB256 = 262144
    pull(
      pull.values(rawFile),
      chunker(KiB256),
      pull.collect((err, chunks) => {
        expect(err).to.not.exists

        expect(chunks).to.have.length(4)
        chunks.forEach((chunk) => {
          expect(chunk).to.have.length(KiB256)
        })
        done()
      })
    )
  })

  it('256 KiB chunks of non scalar filesize', (done) => {
    const KiB256 = 262144
    let file = Buffer.concat([rawFile, new Buffer('hello')])

    pull(
      pull.values(file),
      chunker(KiB256),
      pull.collect((err, chunks) => {
        expect(err).to.not.exists

        expect(chunks).to.have.length(5)
        let counter = 0

        chunks.forEach((chunk) => {
          if (chunk.length < KiB256) {
            counter++
          } else {
            expect(chunk).to.have.length(KiB256)
          }
        })

        expect(counter).to.be.eql(1)
        done()
      })
    )
  })
})
