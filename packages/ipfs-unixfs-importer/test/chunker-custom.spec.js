/* eslint-env mocha */
'use strict'

const importer = require('../src')
const { Buffer } = require('buffer')
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const mc = require('multicodec')
const blockApi = require('./helpers/block')

// eslint bug https://github.com/eslint/eslint/issues/12459
// eslint-disable-next-line require-await
const iter = async function * () {
  yield Buffer.from('one')
  yield Buffer.from('two')
}

describe('custom chunker', function () {
  let inmem
  let block

  const fromPartsTest = (iter, size) => async () => {
    for await (const part of importer([{
      content: iter()
    }], block, {
      chunkValidator: source => source,
      chunker: source => source,
      bufferImporter: async function * (file, source, ipld, options) {
        for await (const item of source) {
          yield () => Promise.resolve(item)
        }
      }
    })) {
      expect(part.size).to.equal(size)
    }
  }

  before(async () => {
    inmem = await inMemory(IPLD)
    block = blockApi(inmem)
  })

  it('keeps custom chunking', async () => {
    const chunker = source => source
    const content = iter()
    for await (const part of importer([{ path: 'test', content }], block, {
      chunker
    })) {
      expect(part.size).to.equal(116)
    }
  })

  // eslint bug https://github.com/eslint/eslint/issues/12459
  const multi = async function * () {
    yield {
      size: 11,
      cid: await inmem.put(Buffer.from('hello world'), mc.RAW)
    }
    yield {
      size: 11,
      cid: await inmem.put(Buffer.from('hello world'), mc.RAW)
    }
  }
  it('works with multiple parts', fromPartsTest(multi, 120))

  const single = async function * () {
    yield {
      size: 11,
      cid: await inmem.put(Buffer.from('hello world'), mc.RAW)
    }
  }
  it('works with single part', fromPartsTest(single, 11))
})
