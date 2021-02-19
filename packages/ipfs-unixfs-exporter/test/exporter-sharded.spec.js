/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')
// @ts-ignore
const IPLD = require('ipld')
// @ts-ignore
const inMemory = require('ipld-in-memory')
const UnixFS = require('ipfs-unixfs')
const mh = require('multihashing-async').multihash
const mc = require('multicodec')
const all = require('it-all')
const last = require('it-last')
const randomBytes = require('it-buffer-stream')
const exporter = require('../src')
const importer = require('ipfs-unixfs-importer')
const {
  DAGLink,
  DAGNode
} = require('ipld-dag-pb')
const blockApi = require('./helpers/block')
const uint8ArrayConcat = require('uint8arrays/concat')

/**
 * @typedef {import('cids')} CID
 */

const SHARD_SPLIT_THRESHOLD = 10

describe('exporter sharded', function () {
  this.timeout(30000)

  /** @type {import('ipfs-core-types/src/ipld').IPLD} */
  let ipld
  /** @type {import('ipfs-unixfs-importer').BlockAPI} */
  let block

  /**
   * @param {number} numFiles
   */
  const createShard = (numFiles) => {
    return createShardWithFileNames(numFiles, (index) => `file-${index}`)
  }

  /**
   * @param {number} numFiles
   * @param {(index: number) => string} fileName
   */
  const createShardWithFileNames = (numFiles, fileName) => {
    const files = new Array(numFiles).fill(0).map((_, index) => ({
      path: fileName(index),
      content: Uint8Array.from([0, 1, 2, 3, 4, index])
    }))

    return createShardWithFiles(files)
  }

  /**
   * @param {{ path: string, content: Uint8Array }[] } files
   */
  const createShardWithFiles = async (files) => {
    const result = await last(importer(files, block, {
      shardSplitThreshold: SHARD_SPLIT_THRESHOLD,
      wrapWithDirectory: true
    }))

    if (!result) {
      throw new Error('Failed to make shard')
    }

    return result.cid
  }

  before(async () => {
    ipld = await inMemory(IPLD)
    block = blockApi(ipld)
  })

  it('exports a sharded directory', async () => {
    /** @type {{ [key: string]: { content: Uint8Array, cid?: CID }}} */
    const files = {}

    for (let i = 0; i < (SHARD_SPLIT_THRESHOLD + 1); i++) {
      files[`file-${Math.random()}.txt`] = {
        content: uint8ArrayConcat(await all(randomBytes(100)))
      }
    }

    const imported = await all(importer(Object.keys(files).map(path => ({
      path,
      content: files[path].content
    })), block, {
      wrapWithDirectory: true,
      shardSplitThreshold: SHARD_SPLIT_THRESHOLD
    }))

    const dirCid = imported.pop()?.cid

    if (!dirCid) {
      throw new Error('No directory CID found')
    }

    // store the CIDs, we will validate them later
    imported.forEach(imported => {
      if (!imported.path) {
        throw new Error('Imported file did not have a path')
      }

      files[imported.path].cid = imported.cid
    })

    const dir = await ipld.get(dirCid)
    const dirMetadata = UnixFS.unmarshal(dir.Data)

    expect(dirMetadata.type).to.equal('hamt-sharded-directory')

    const exported = await exporter(dirCid, ipld)

    expect(exported.cid.equals(dirCid)).to.be.true()

    if (exported.type !== 'directory') {
      throw new Error('Expected directory')
    }

    if (!exported.content) {
      throw new Error('No content found on exported entry')
    }

    const dirFiles = await all(exported.content())
    expect(dirFiles.length).to.equal(Object.keys(files).length)

    for (let i = 0; i < dirFiles.length; i++) {
      const dirFile = dirFiles[i]

      if (dirFile.type !== 'file') {
        throw new Error('Expected file')
      }

      const data = uint8ArrayConcat(await all(dirFile.content()))

      // validate the CID
      expect(files[dirFile.name]).to.have.property('cid').that.deep.equals(dirFile.cid)

      // validate the exported file content
      expect(files[dirFile.name].content).to.deep.equal(data)
    }
  })

  it('exports all files from a sharded directory with subshards', async () => {
    const numFiles = 31
    const dirCid = await createShard(numFiles)
    const exported = await exporter(dirCid, ipld)

    if (exported.type !== 'directory') {
      throw new Error('Unexpected type')
    }

    const files = await all(exported.content())
    expect(files.length).to.equal(numFiles)

    expect(exported.unixfs.type).to.equal('hamt-sharded-directory')

    files.forEach(file => {
      if (file.type !== 'file') {
        throw new Error('Unexpected type')
      }

      expect(file.unixfs.type).to.equal('file')
    })
  })

  it('exports one file from a sharded directory', async () => {
    const dirCid = await createShard(31)
    const exported = await exporter(`/ipfs/${dirCid.toBaseEncodedString()}/file-14`, ipld)

    expect(exported).to.have.property('name', 'file-14')
  })

  it('exports one file from a sharded directory sub shard', async () => {
    const dirCid = await createShard(31)
    const exported = await exporter(`/ipfs/${dirCid.toBaseEncodedString()}/file-30`, ipld)

    expect(exported.name).to.deep.equal('file-30')
  })

  it('exports one file from a shard inside a shard inside a shard', async () => {
    const dirCid = await createShard(2568)
    const exported = await exporter(`/ipfs/${dirCid.toBaseEncodedString()}/file-2567`, ipld)

    expect(exported.name).to.deep.equal('file-2567')
  })

  it('extracts a deep folder from the sharded directory', async () => {
    const dirCid = await createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`)
    const exported = await exporter(`/ipfs/${dirCid.toBaseEncodedString()}/foo/bar/baz`, ipld)

    expect(exported.name).to.deep.equal('baz')
  })

  it('extracts an intermediate folder from the sharded directory', async () => {
    const dirCid = await createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`)
    const exported = await exporter(`/ipfs/${dirCid.toBaseEncodedString()}/foo/bar`, ipld)

    expect(exported.name).to.deep.equal('bar')
  })

  it('uses .path to extract all intermediate entries from the sharded directory', async () => {
    const dirCid = await createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`)
    const exported = await all(exporter.path(`/ipfs/${dirCid.toBaseEncodedString()}/foo/bar/baz/file-1`, ipld))

    expect(exported.length).to.equal(5)

    expect(exported[0].name).to.equal(dirCid.toBaseEncodedString())
    expect(exported[1].name).to.equal('foo')
    expect(exported[1].path).to.equal(`${dirCid.toBaseEncodedString()}/foo`)
    expect(exported[2].name).to.equal('bar')
    expect(exported[2].path).to.equal(`${dirCid.toBaseEncodedString()}/foo/bar`)
    expect(exported[3].name).to.equal('baz')
    expect(exported[3].path).to.equal(`${dirCid.toBaseEncodedString()}/foo/bar/baz`)
    expect(exported[4].name).to.equal('file-1')
    expect(exported[4].path).to.equal(`${dirCid.toBaseEncodedString()}/foo/bar/baz/file-1`)
  })

  it('uses .path to extract all intermediate entries from the sharded directory as well as the contents', async () => {
    const dirCid = await createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`)
    const exported = await all(exporter.path(`/ipfs/${dirCid.toBaseEncodedString()}/foo/bar/baz`, ipld))

    expect(exported.length).to.equal(4)

    expect(exported[1].name).to.equal('foo')
    expect(exported[2].name).to.equal('bar')
    expect(exported[3].name).to.equal('baz')

    if (exported[3].type !== 'directory') {
      throw new Error('Expected file')
    }

    const files = await all(exported[3].content())

    expect(files.length).to.equal(31)

    files.forEach(file => {
      if (file.type !== 'file') {
        throw new Error('Unexpected type')
      }

      expect(file.unixfs.type).to.equal('file')
    })
  })

  it('exports a file from a sharded directory inside a regular directory inside a sharded directory', async () => {
    const dirCid = await createShard(15)

    const node = new DAGNode(new UnixFS({ type: 'directory' }).marshal(), [
      new DAGLink('shard', 5, dirCid)
    ])
    const nodeCid = await ipld.put(node, mc.DAG_PB, {
      cidVersion: 0,
      hashAlg: mh.names['sha2-256']
    })

    const shardNode = new DAGNode(new UnixFS({ type: 'hamt-sharded-directory' }).marshal(), [
      new DAGLink('75normal-dir', 5, nodeCid)
    ])
    const shardNodeCid = await ipld.put(shardNode, mc.DAG_PB, {
      cidVersion: 1,
      hashAlg: mh.names['sha2-256']
    })

    const exported = await exporter(`/ipfs/${shardNodeCid.toBaseEncodedString()}/normal-dir/shard/file-1`, ipld)

    expect(exported.name).to.deep.equal('file-1')
  })
})
