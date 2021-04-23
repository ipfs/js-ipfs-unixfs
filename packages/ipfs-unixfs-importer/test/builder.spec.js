/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')
const mh = require('multiformats/hashes/digest')
const { sha256, sha512 } = require('multiformats/hashes/sha2')
const { decode } = require('@ipld/dag-pb')
const { UnixFS } = require('ipfs-unixfs')
const builder = require('../src/dag-builder')
const first = require('it-first')
const blockApi = require('./helpers/block')
const uint8ArrayFromString = require('uint8arrays/from-string')
const defaultOptions = require('../src/options')
const asAsyncIterable = require('./helpers/as-async-iterable')

describe('builder', () => {
  /** @type {import('../src').BlockAPI} */
  const block = blockApi()

  const testMultihashes = [sha256, sha512]

  it('allows multihash hash algorithm to be specified', async () => {
    for (let i = 0; i < testMultihashes.length; i++) {
      const hasher = testMultihashes[i]
      const content = uint8ArrayFromString(String(Math.random() + Date.now()))
      const inputFile = {
        path: content + '.txt',
        content: asAsyncIterable(content)
      }

      const result = await first(builder([inputFile], block, {
        ...defaultOptions(),
        hasher
      }))

      if (!result) {
        throw new Error('Nothing built')
      }

      const imported = await result()
      expect(imported).to.exist()

      // Verify multihash has been encoded using hasher
      expect(mh.decode(imported.cid.multihash.bytes).code).to.equal(hasher.code)

      // Fetch using hasher encoded multihash
      const importedBlock = await block.get(imported.cid)
      const node = decode(importedBlock.bytes)
      if (!node.Data) {
        throw new Error('PBNode Data undefined')
      }
      const fetchedContent = UnixFS.unmarshal(node.Data).data
      expect(fetchedContent).to.deep.equal(content)
    }
  })

  it('allows multihash hash algorithm to be specified for big file', async function () {
    this.timeout(30000)

    for (let i = 0; i < testMultihashes.length; i++) {
      const hasher = testMultihashes[i]
      const content = String(Math.random() + Date.now())
      const inputFile = {
        path: content + '.txt',
        // Bigger than maxChunkSize
        content: asAsyncIterable(new Uint8Array(262144 + 5).fill(1))
      }

      const result = await first(builder([inputFile], block, {
        ...defaultOptions(),
        hasher
      }))

      if (!result) {
        throw new Error('Nothing built')
      }

      const imported = await result()

      expect(imported).to.exist()
      expect(mh.decode(imported.cid.multihash.bytes).code).to.equal(hasher.code)
    }
  })

  it('allows multihash hash algorithm to be specified for a directory', async () => {
    for (let i = 0; i < testMultihashes.length; i++) {
      const hasher = testMultihashes[i]
      const inputFile = {
        path: `${String(Math.random() + Date.now())}-dir`
      }

      const result = await first(builder([{ ...inputFile }], block, {
        ...defaultOptions(),
        hasher
      }))

      if (!result) {
        return new Error('Nothing built')
      }

      const imported = await result()

      expect(mh.decode(imported.cid.multihash.bytes).code).to.equal(hasher.code)

      // Fetch using hasher encoded multihash
      const importedBlock = await block.get(imported.cid)
      const node = decode(importedBlock.bytes)

      if (!node.Data) {
        throw new Error('PBNode Data undefined')
      }
      const meta = UnixFS.unmarshal(node.Data)
      expect(meta.type).to.equal('directory')
    }
  })
})
