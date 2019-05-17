/* eslint-env mocha */
'use strict'

const chunker = require('../src/chunker/rabin')
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const loadFixture = require('aegir/fixtures')
const os = require('os')
const isNode = require('detect-node')
const all = require('async-iterator-all')

const rawFile = loadFixture((isNode ? __dirname : 'test') + '/fixtures/1MiB.txt')

describe('chunker: rabin', function () {
  this.timeout(30000)

  before(function () {
    if (os.platform() === 'win32') {
      return this.skip()
    }

    if (!isNode) {
      this.skip()
    }
  })

  it('chunks non flat buffers', async () => {
    const b1 = Buffer.alloc(2 * 256)
    const b2 = Buffer.alloc(1 * 256)
    const b3 = Buffer.alloc(5 * 256)

    b1.fill('a')
    b2.fill('b')
    b3.fill('c')

    const chunks = await all(chunker([b1, b2, b3], {
      minChunkSize: 48,
      avgChunkSize: 96,
      maxChunkSize: 192,
      window: 16,
      polynomial: '0x3DF305DFB2A805'
    }))

    chunks.forEach((chunk) => {
      expect(chunk).to.have.length.gte(48)
      expect(chunk).to.have.length.lte(192)
    })
  })

  it('uses default min and max chunk size when only avgChunkSize is specified', async () => {
    const b1 = Buffer.alloc(10 * 256)
    b1.fill('a')

    const chunks = await all(chunker([b1], {
      maxChunkSize: 262144,
      minChunkSize: 1,
      avgChunkSize: 256,
      window: 16,
      polynomial: '0x3DF305DFB2A805'
    }))

    chunks.forEach((chunk) => {
      expect(chunk).to.have.length.gte(256 / 3)
      expect(chunk).to.have.length.lte(256 * (256 / 2))
    })
  })

  it('256 KiB avg chunks of non scalar filesize', async () => {
    const KiB256 = 262144
    let file = Buffer.concat([rawFile, Buffer.from('hello')])
    const opts = {
      minChunkSize: KiB256 / 3,
      avgChunkSize: KiB256,
      maxChunkSize: KiB256 + (KiB256 / 2),
      window: 16,
      polynomial: '0x3DF305DFB2A805'
    }

    const chunks = await all(chunker([file], opts))

    chunks.forEach((chunk) => {
      expect(chunk).to.have.length.gte(opts.minChunkSize)
      expect(chunk).to.have.length.lte(opts.maxChunkSize)
    })
  })
})
