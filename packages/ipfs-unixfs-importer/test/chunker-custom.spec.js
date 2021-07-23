/* eslint-env mocha */
import { importer } from '../src/index.js'
import { expect } from 'aegir/utils/chai.js'

import * as rawCodec from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import * as Block from 'multiformats/block'
import blockApi from './helpers/block.js'
import uint8ArrayFromString from 'uint8arrays/from-string.js'
import { UnixFS } from 'ipfs-unixfs'

const iter = async function * () {
  yield uint8ArrayFromString('one')
  yield uint8ArrayFromString('two')
}

describe('custom chunker', function () {
  const block = blockApi()

  /**
   * @param {AsyncIterable<Uint8Array>} content
   * @param {number} size
   */
  const fromPartsTest = (content, size) => async () => {
    /**
     * @param {Uint8Array} buf
     */
    const put = async (buf) => {
      const encodedBlock = await Block.encode({
        value: buf,
        codec: rawCodec,
        hasher: sha256
      })

      return {
        cid: encodedBlock.cid,
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
