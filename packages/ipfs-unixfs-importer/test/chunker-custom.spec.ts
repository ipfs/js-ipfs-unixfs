import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import { UnixFS } from 'ipfs-unixfs'
import * as Block from 'multiformats/block'
import * as rawCodec from 'multiformats/codecs/raw'
import { sha256 } from 'multiformats/hashes/sha2'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { importer } from '../src/index.js'
import type { CID } from 'multiformats'

const iter = async function * (): AsyncGenerator<Uint8Array, void, unknown> {
  yield uint8ArrayFromString('one')
  yield uint8ArrayFromString('two')
}

describe('custom chunker', function () {
  const block = new MemoryBlockstore()

  const fromPartsTest = (content: AsyncIterable<Uint8Array>, size: bigint) => async () => {
    const put = async (buf: Uint8Array): Promise<{ cid: CID, size: bigint, unixfs: UnixFS, block: Uint8Array }> => {
      const encodedBlock = await Block.encode({
        value: buf,
        codec: rawCodec,
        hasher: sha256
      })

      return {
        cid: encodedBlock.cid,
        size: BigInt(buf.length),
        unixfs: new UnixFS(),
        block: buf
      }
    }

    for await (const part of importer([{
      content
    }], block, {
      chunker: source => source,
      bufferImporter: async function * (file, block) {
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
      chunker: source => source,
      rawLeaves: false,
      cidVersion: 0
    })) {
      expect(part.size).to.equal(116n)
    }
  })

  const multi = async function * (): AsyncGenerator<Uint8Array, void, unknown> {
    yield uint8ArrayFromString('hello world')
    yield uint8ArrayFromString('hello world')
  }
  it('works with multiple parts', fromPartsTest(multi(), 120n))

  const single = async function * (): AsyncGenerator<Uint8Array, void, unknown> {
    yield uint8ArrayFromString('hello world')
  }

  it('works with single part', fromPartsTest(single(), 11n))
})
