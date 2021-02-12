/* eslint-env mocha */
'use strict'

const chunker = require('../src/chunker/rabin')
const { expect } = require('aegir/utils/chai')
const all = require('it-all')
const uint8ArrayFromString = require('uint8arrays/from-string')
const uint8ArrayConcat = require('uint8arrays/concat')
const asAsyncIterable = require('./helpers/as-async-iterable')
const defaultOptions = require('../src/options')

const rawFile = new Uint8Array(Math.pow(2, 20)).fill(1)

describe('chunker: rabin', function () {
  this.timeout(30000)

  it('chunks non flat buffers', async () => {
    const b1 = new Uint8Array(2 * 256)
    const b2 = new Uint8Array(1 * 256)
    const b3 = new Uint8Array(5 * 256)

    b1.fill('a'.charCodeAt(0))
    b2.fill('b'.charCodeAt(0))
    b3.fill('c'.charCodeAt(0))

    const chunks = await all(chunker(asAsyncIterable([b1, b2, b3]), {
      ...defaultOptions(),
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
    const b1 = new Uint8Array(10 * 256)
    b1.fill('a'.charCodeAt(0))

    const chunks = await all(chunker(asAsyncIterable([b1]), {
      ...defaultOptions(),
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
    const file = uint8ArrayConcat([rawFile, uint8ArrayFromString('hello')])
    const opts = {
      ...defaultOptions(),
      minChunkSize: Math.round(KiB256 / 3),
      avgChunkSize: KiB256,
      maxChunkSize: Math.round(KiB256 + (KiB256 / 2))
    }

    const chunks = await all(chunker(asAsyncIterable([file]), opts))

    chunks.forEach((chunk) => {
      expect(chunk).to.have.length.gte(opts.minChunkSize)
      expect(chunk).to.have.length.lte(opts.maxChunkSize)
    })
  })

  it('throws when min chunk size is too small', async () => {
    const opts = {
      ...defaultOptions(),
      minChunkSize: 1,
      maxChunkSize: 100
    }

    try {
      await all(chunker(asAsyncIterable([]), opts))
      throw new Error('Should have thrown')
    } catch (err) {
      expect(err.code).to.equal('ERR_INVALID_MIN_CHUNK_SIZE')
    }
  })

  it('throws when avg chunk size is not specified', async () => {
    const opts = {
      ...defaultOptions(),
      avgChunkSize: undefined
    }

    try {
      // @ts-expect-error invalid opts
      await all(chunker(asAsyncIterable([]), opts))
      throw new Error('Should have thrown')
    } catch (err) {
      expect(err.code).to.equal('ERR_INVALID_AVG_CHUNK_SIZE')
    }
  })

  it('uses the min chunk size when max and avg are too small', async () => {
    const file = uint8ArrayConcat([rawFile, uint8ArrayFromString('hello')])
    const opts = {
      ...defaultOptions(),
      minChunkSize: 100,
      maxChunkSize: 5,
      avgChunkSize: 5
    }

    const chunks = await all(chunker(asAsyncIterable([file]), opts))

    chunks.forEach((chunk, index) => {
      if (index === chunks.length - 1) {
        expect(chunk.length).to.equal(81)
      } else {
        expect(chunk.length).to.equal(100)
      }
    })
  })
})
