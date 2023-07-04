/* eslint-env mocha */

import { expect } from 'aegir/chai'
import all from 'it-all'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { isElectronRenderer } from 'wherearewe'
import { rabin } from '../src/chunker/rabin.js'
import asAsyncIterable from './helpers/as-async-iterable.js'

const rawFile = new Uint8Array(Math.pow(2, 20)).fill(1)

describe('chunker: rabin', function () {
  this.timeout(30000)

  if (isElectronRenderer) {
    it('Does not work on the electron renderer thread - https://github.com/hugomrdias/rabin-wasm/issues/127', function () {
      this.skip()
    })

    return
  }

  it('Allows constructing without any options', () => {
    expect(() => rabin()).to.not.throw()
  })

  it('chunks non flat buffers', async () => {
    const b1 = new Uint8Array(2 * 256)
    const b2 = new Uint8Array(1 * 256)
    const b3 = new Uint8Array(5 * 256)

    b1.fill('a'.charCodeAt(0))
    b2.fill('b'.charCodeAt(0))
    b3.fill('c'.charCodeAt(0))

    const chunks = await all(rabin({
      minChunkSize: 48,
      avgChunkSize: 96,
      maxChunkSize: 192
    })(asAsyncIterable([b1, b2, b3])))

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

    const chunks = await all(rabin({
      maxChunkSize: 262144,
      minChunkSize: 18,
      avgChunkSize: 256
    })(asAsyncIterable([b1])))

    chunks.forEach((chunk) => {
      expect(chunk).to.have.length.gte(256 / 3)
      expect(chunk).to.have.length.lte(256 * (256 / 2))
    })
  })

  it('256 KiB avg chunks of non scalar filesize', async () => {
    const KiB256 = 262144
    const file = uint8ArrayConcat([rawFile, uint8ArrayFromString('hello')])
    const opts = {
      minChunkSize: Math.round(KiB256 / 3),
      avgChunkSize: KiB256,
      maxChunkSize: Math.round(KiB256 + (KiB256 / 2))
    }

    const chunks = await all(rabin(opts)(asAsyncIterable([file])))

    chunks.forEach((chunk) => {
      expect(chunk).to.have.length.gte(opts.minChunkSize)
      expect(chunk).to.have.length.lte(opts.maxChunkSize)
    })
  })

  it('throws when min chunk size is too small', async () => {
    const opts = {
      minChunkSize: 1,
      maxChunkSize: 100
    }

    try {
      await all(rabin(opts)(asAsyncIterable([])))
      throw new Error('Should have thrown')
    } catch (err: any) {
      expect(err.code).to.equal('ERR_INVALID_MIN_CHUNK_SIZE')
    }
  })

  it('throws when invalid avg chunk size is specified', async () => {
    const opts = {
      avgChunkSize: 'fortytwo'
    }

    try {
      // @ts-expect-error invalid input
      await all(rabin(opts)(asAsyncIterable([])))
      throw new Error('Should have thrown')
    } catch (err: any) {
      expect(err.code).to.equal('ERR_INVALID_AVG_CHUNK_SIZE')
    }
  })

  it('throws when invalid min chunk size is specified', async () => {
    const opts = {
      minChunkSize: 'fortytwo'
    }

    try {
      // @ts-expect-error invalid input
      await all(rabin(opts)(asAsyncIterable([])))
      throw new Error('Should have thrown')
    } catch (err: any) {
      expect(err.code).to.equal('ERR_INVALID_CHUNK_SIZE')
    }
  })

  it('throws when invalid max chunk size is specified', async () => {
    const opts = {
      maxChunkSize: 'fortytwo'
    }

    try {
      // @ts-expect-error invalid input
      await all(rabin(opts)(asAsyncIterable([])))
      throw new Error('Should have thrown')
    } catch (err: any) {
      expect(err.code).to.equal('ERR_INVALID_CHUNK_SIZE')
    }
  })

  it('uses the min chunk size when max and avg are too small', async () => {
    const file = uint8ArrayConcat([rawFile, uint8ArrayFromString('hello')])
    const opts = {
      minChunkSize: 100,
      maxChunkSize: 5,
      avgChunkSize: 5
    }

    const chunks = await all(rabin(opts)(asAsyncIterable([file])))

    chunks.forEach((chunk, index) => {
      if (index === chunks.length - 1) {
        expect(chunk.length).to.equal(81)
      } else {
        expect(chunk.length).to.equal(100)
      }
    })
  })
})
