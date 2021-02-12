/* eslint-env mocha */
'use strict'

const chunker = require('../src/chunker/fixed-size')
const { expect } = require('aegir/utils/chai')
const all = require('it-all')
const rawFile = new Uint8Array(Math.pow(2, 20))
const uint8ArrayFromString = require('uint8arrays/from-string')
const uint8ArrayConcat = require('uint8arrays/concat')
const defaultOptions = require('../src/options')
const asAsyncIterable = require('./helpers/as-async-iterable')

describe('chunker: fixed size', function () {
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
      maxChunkSize: 256
    }))

    expect(chunks).to.have.length(8)
    chunks.forEach((chunk) => {
      expect(chunk).to.have.length(256)
    })
  })

  it('256 Bytes chunks', async () => {
    const input = []
    const buf = uint8ArrayFromString('a')

    for (let i = 0; i < (256 * 12); i++) {
      input.push(buf)
    }
    const chunks = await all(chunker(asAsyncIterable(input), {
      ...defaultOptions(),
      maxChunkSize: 256
    }))

    expect(chunks).to.have.length(12)
    chunks.forEach((chunk) => {
      expect(chunk).to.have.length(256)
    })
  })

  it('256 KiB chunks', async () => {
    const KiB256 = 262144
    const chunks = await all(chunker(asAsyncIterable([rawFile]), {
      ...defaultOptions(),
      maxChunkSize: KiB256
    }))

    expect(chunks).to.have.length(4)
    chunks.forEach((chunk) => {
      expect(chunk).to.have.length(KiB256)
    })
  })

  it('256 KiB chunks of non scalar filesize', async () => {
    const KiB256 = 262144
    const file = uint8ArrayConcat([rawFile, uint8ArrayFromString('hello')])

    const chunks = await all(chunker(asAsyncIterable([file]), {
      ...defaultOptions(),
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
