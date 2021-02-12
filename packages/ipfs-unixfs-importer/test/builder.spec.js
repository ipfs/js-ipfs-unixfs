/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')
const mh = require('multihashing-async').multihash
// @ts-ignore
const IPLD = require('ipld')
// @ts-ignore
const inMemory = require('ipld-in-memory')
const UnixFS = require('ipfs-unixfs')
const builder = require('../src/dag-builder')
const first = require('it-first')
const blockApi = require('./helpers/block')
const uint8ArrayFromString = require('uint8arrays/from-string')
const defaultOptions = require('../src/options')

describe('builder', () => {
  /** @type {import('./helpers/block').IPLDResolver} */
  let ipld
  /** @type {import('../src').BlockAPI} */
  let block

  before(async () => {
    ipld = await inMemory(IPLD)
    block = blockApi(ipld)
  })

  const testMultihashes = Object.keys(mh.names).slice(1, 10)

  it('allows multihash hash algorithm to be specified', async () => {
    for (let i = 0; i < testMultihashes.length; i++) {
      const hashAlg = testMultihashes[i]
      const content = String(Math.random() + Date.now())
      const inputFile = {
        path: content + '.txt',
        content: uint8ArrayFromString(content)
      }

      const result = await first(builder([inputFile], block, {
        ...defaultOptions(),
        // @ts-ignore thinks these aren't valid hash alg names
        hashAlg
      }))

      if (!result) {
        throw new Error('Nothing built')
      }

      const imported = await result()

      expect(imported).to.exist()

      // Verify multihash has been encoded using hashAlg
      expect(mh.decode(imported.cid.multihash).name).to.equal(hashAlg)

      // Fetch using hashAlg encoded multihash
      const node = await ipld.get(imported.cid)

      const fetchedContent = UnixFS.unmarshal(node.Data).data
      expect(fetchedContent).to.deep.equal(inputFile.content)
    }
  })

  it('allows multihash hash algorithm to be specified for big file', async function () {
    this.timeout(30000)

    for (let i = 0; i < testMultihashes.length; i++) {
      const hashAlg = testMultihashes[i]
      const content = String(Math.random() + Date.now())
      const inputFile = {
        path: content + '.txt',
        // Bigger than maxChunkSize
        content: new Uint8Array(262144 + 5).fill(1)
      }

      const result = await first(builder([inputFile], block, {
        ...defaultOptions(),
        // @ts-ignore thinks these aren't valid hash alg names
        hashAlg
      }))

      if (!result) {
        throw new Error('Nothing built')
      }

      const imported = await result()

      expect(imported).to.exist()
      expect(mh.decode(imported.cid.multihash).name).to.equal(hashAlg)
    }
  })

  it('allows multihash hash algorithm to be specified for a directory', async () => {
    for (let i = 0; i < testMultihashes.length; i++) {
      const hashAlg = testMultihashes[i]
      const inputFile = {
        path: `${String(Math.random() + Date.now())}-dir`
      }

      const result = await first(builder([{ ...inputFile }], block, {
        ...defaultOptions(),
        // @ts-ignore thinks these aren't valid hash alg names
        hashAlg
      }))

      if (!result) {
        return new Error('Nothing built')
      }

      const imported = await result()

      expect(mh.decode(imported.cid.multihash).name).to.equal(hashAlg)

      // Fetch using hashAlg encoded multihash
      const node = await ipld.get(imported.cid)

      const meta = UnixFS.unmarshal(node.Data)
      expect(meta.type).to.equal('directory')
    }
  })
})
