/* eslint-env mocha */
'use strict'

const importer = require('../src')
const { expect } = require('aegir/utils/chai')
// @ts-ignore
const IPLD = require('ipld')
// @ts-ignore
const inMemory = require('ipld-in-memory')
const mc = require('multicodec')
const blockApi = require('./helpers/block')
const uint8ArrayFromString = require('uint8arrays/from-string')
const UnixFS = require('ipfs-unixfs')

const iter = async function * () {
  yield uint8ArrayFromString('one')
  yield uint8ArrayFromString('two')
}

describe('custom chunker', function () {
  /** @type {import('./helpers/block').IPLD} */
  let ipld
  /** @type {import('../src').BlockAPI} */
  let block

  /**
   * @param {AsyncIterable<Uint8Array>} content
   * @param {number} size
   */
  const fromPartsTest = (content, size) => async () => {
    /**
     * @param {Uint8Array} buf
     */
    const put = async (buf) => {
      const cid = await ipld.put(buf, mc.RAW)
      return {
        cid,
        size: buf.length,
        unixfs: new UnixFS()
      }
    }

    for await (const part of importer([{
      content
    }], block, {
      chunker: source => source,
      bufferImporter: async function * (file, block, options) {
        for await (const item of file.content) {
          yield async () => put(item)
        }
      }
    })) {
      expect(part.size).to.equal(size)
    }
  }

  before(async () => {
    ipld = await inMemory(IPLD)
    block = blockApi(ipld)
  })

  it('keeps custom chunking', async () => {
    const content = iter()
    for await (const part of importer([{ path: 'test', content }], block, {
      chunker: source => source
    })) {
      expect(part.size).to.equal(116)
    }
  })

  const multi = async function * () {
    yield uint8ArrayFromString('hello world')
    yield uint8ArrayFromString('hello world')
  }
  it('works with multiple parts', fromPartsTest(multi(), 120))

  const single = async function * () {
    yield uint8ArrayFromString('hello world')
  }

  it('works with single part', fromPartsTest(single(), 11))
})
