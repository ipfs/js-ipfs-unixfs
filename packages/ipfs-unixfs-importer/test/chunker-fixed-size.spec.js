/* eslint-env mocha */
'use strict'

const { Buffer } = require('buffer')
const chunker = require('../src/chunker/fixed-size')
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const isNode = require('detect-node')
const all = require('it-all')
const loadFixture = require('aegir/fixtures')
const rawFile = loadFixture((isNode ? __dirname : 'test') + '/fixtures/1MiB.txt')

describe('chunker: fixed size', function () {
  this.timeout(30000)

  it('chunks non flat buffers', async () => {
    const b1 = Buffer.alloc(2 * 256)
    const b2 = Buffer.alloc(1 * 256)
    const b3 = Buffer.alloc(5 * 256)

    b1.fill('a')
    b2.fill('b')
    b3.fill('c')

    const chunks = await all(chunker([b1, b2, b3], {
      maxChunkSize: 256
    }))

    expect(chunks).to.have.length(8)
    chunks.forEach((chunk) => {
      expect(chunk).to.have.length(256)
    })
  })

  it('256 Bytes chunks', async () => {
    const input = []
    const buf = Buffer.from('a')

    for (let i = 0; i < (256 * 12); i++) {
      input.push(buf)
    }
    const chunks = await all(chunker(input, {
      maxChunkSize: 256
    }))

    expect(chunks).to.have.length(12)
    chunks.forEach((chunk) => {
      expect(chunk).to.have.length(256)
    })
  })

  it('256 KiB chunks', async () => {
    const KiB256 = 262144
    const chunks = await all(chunker([rawFile], {
      maxChunkSize: KiB256
    }))

    expect(chunks).to.have.length(4)
    chunks.forEach((chunk) => {
      expect(chunk).to.have.length(KiB256)
    })
  })

  it('256 KiB chunks of non scalar filesize', async () => {
    const KiB256 = 262144
    const file = Buffer.concat([rawFile, Buffer.from('hello')])

    const chunks = await all(chunker([file], {
      maxChunkSize: KiB256
    }))

    expect(chunks).to.have.length(5)
    let counter = 0

    chunks.forEach((chunk) => {
      if (chunk.length < KiB256) {
        counter++
      } else {
        expect(chunk).to.have.length(KiB256)
      }
    })

    expect(counter).to.equal(1)
  })
})
