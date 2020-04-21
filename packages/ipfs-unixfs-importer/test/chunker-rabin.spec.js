/* eslint-env mocha */
'use strict'

const { Buffer } = require('buffer')
const chunker = require('../src/chunker/rabin')
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const loadFixture = require('aegir/fixtures')
const isNode = require('detect-node')
const all = require('it-all')

const rawFile = loadFixture((isNode ? __dirname : 'test') + '/fixtures/1MiB.txt')

describe('chunker: rabin', function () {
  this.timeout(30000)

  const defaultOptions = {
    avgChunkSize: 262144,
    window: 64,
    polynomial: 17437180132763653
  }

  it('chunks non flat buffers', async () => {
    const b1 = Buffer.alloc(2 * 256)
    const b2 = Buffer.alloc(1 * 256)
    const b3 = Buffer.alloc(5 * 256)

    b1.fill('a')
    b2.fill('b')
    b3.fill('c')

    const chunks = await all(chunker([b1, b2, b3], {
      ...defaultOptions,
      minChunkSize: 48,
      avgChunkSize: 96,
      maxChunkSize: 192
    }))

    const size = chunks.reduce((acc, curr) => acc + curr.length, 0)

    expect(size).to.equal(b1.length + b2.length + b3.length)

    chunks.forEach((chunk, index) => {
      if (index === chunks.length - 1) {
        expect(chunk.length).to.equal(128)
      } else {
        expect(chunk.length).to.equal(192)
      }
    })
  })

  it('uses default min and max chunk size when only avgChunkSize is specified', async () => {
    const b1 = Buffer.alloc(10 * 256)
    b1.fill('a')

    const chunks = await all(chunker([b1], {
      ...defaultOptions,
      maxChunkSize: 262144,
      minChunkSize: 18,
      avgChunkSize: 256
    }))

    chunks.forEach((chunk) => {
      expect(chunk).to.have.length.gte(256 / 3)
      expect(chunk).to.have.length.lte(256 * (256 / 2))
    })
  })

  it('256 KiB avg chunks of non scalar filesize', async () => {
    const KiB256 = 262144
    const file = Buffer.concat([rawFile, Buffer.from('hello')])
    const opts = {
      ...defaultOptions,
      minChunkSize: KiB256 / 3,
      avgChunkSize: KiB256,
      maxChunkSize: KiB256 + (KiB256 / 2)
    }

    const chunks = await all(chunker([file], opts))

    chunks.forEach((chunk) => {
      expect(chunk).to.have.length.gte(opts.minChunkSize)
      expect(chunk).to.have.length.lte(opts.maxChunkSize)
    })
  })

  it('throws when min chunk size is too small', async () => {
    const opts = {
      ...defaultOptions,
      minChunkSize: 1,
      maxChunkSize: 100
    }

    try {
      await all(chunker([], opts))
      throw new Error('Should have thrown')
    } catch (err) {
      expect(err.code).to.equal('ERR_INVALID_MIN_CHUNK_SIZE')
    }
  })

  it('throws when avg chunk size is not specified', async () => {
    const opts = {
      ...defaultOptions,
      avgChunkSize: undefined
    }

    try {
      await all(chunker([], opts))
      throw new Error('Should have thrown')
    } catch (err) {
      expect(err.code).to.equal('ERR_INVALID_AVG_CHUNK_SIZE')
    }
  })

  it('uses the min chunk size when max and avg are too small', async () => {
    const file = Buffer.concat([rawFile, Buffer.from('hello')])
    const opts = {
      ...defaultOptions,
      minChunkSize: 100,
      maxChunkSize: 5,
      avgChunkSize: 5
    }

    const chunks = await all(chunker([file], opts))

    chunks.forEach((chunk, index) => {
      if (index === chunks.length - 1) {
        expect(chunk.length).to.equal(81)
      } else {
        expect(chunk.length).to.equal(100)
      }
    })
  })
})
