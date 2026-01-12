/* eslint-env mocha */

import * as dagPb from '@ipld/dag-pb'
import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import { UnixFS } from 'ipfs-unixfs'
import { importer } from 'ipfs-unixfs-importer'
import all from 'it-all'
import randomBytes from 'it-buffer-stream'
import last from 'it-last'
import map from 'it-map'
import toBuffer from 'it-to-buffer'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { exporter, walkPath } from '../src/index.js'
import { HAMT_FILE_BLOCK, HAMT_FILE_CID, HAMT_INTERMEDIATE_BLOCK, HAMT_INTERMEDIATE_CID, HAMT_ROOT_BLOCK, HAMT_ROOT_CID } from './fixtures/hamt.ts'
import asAsyncIterable from './helpers/as-async-iterable.js'
import type { ImportCandidate } from 'ipfs-unixfs-importer'

const SHARD_SPLIT_THRESHOLD = 10

describe('exporter sharded', function () {
  this.timeout(30000)

  const block = new MemoryBlockstore()

  const createShard = async (numFiles: number): Promise<CID> => {
    return createShardWithFileNames(numFiles, (index) => `file-${index}`)
  }

  const createShardWithFileNames = async (numFiles: number, fileName: (index: number) => string): Promise<CID> => {
    const files = new Array(numFiles).fill(0).map((_, index) => ({
      path: fileName(index),
      content: asAsyncIterable(Uint8Array.from([0, 1, 2, 3, 4, index]))
    }))

    return createShardWithFiles(files)
  }

  const createShardWithFiles = async (files: Array<{ path: string, content: AsyncIterable<Uint8Array> }>): Promise<CID> => {
    const result = await last(importer(files, block, {
      shardSplitThresholdBytes: SHARD_SPLIT_THRESHOLD,
      wrapWithDirectory: true,
      rawLeaves: false
    }))

    if (result == null) {
      throw new Error('Failed to make shard')
    }

    return result.cid
  }

  it('exports a sharded directory', async () => {
    const files: Record<string, { content: Uint8Array, cid?: CID }> = {}

    // needs to result in a block that is larger than SHARD_SPLIT_THRESHOLD bytes
    for (let i = 0; i < 100; i++) {
      files[`file-${Math.random()}.txt`] = {
        content: uint8ArrayConcat(await all(randomBytes(100)))
      }
    }

    const imported = await all(importer(Object.keys(files).map(path => ({
      path,
      content: asAsyncIterable(files[path].content)
    })), block, {
      wrapWithDirectory: true,
      shardSplitThresholdBytes: SHARD_SPLIT_THRESHOLD,
      rawLeaves: false
    }))

    const dirCid = imported.pop()?.cid

    if (dirCid == null) {
      throw new Error('No directory CID found')
    }

    // store the CIDs, we will validate them later
    imported.forEach(imported => {
      if (imported.path == null) {
        throw new Error('Imported file did not have a path')
      }

      files[imported.path].cid = imported.cid
    })

    const encodedBlock = await toBuffer(block.get(dirCid))
    const dir = dagPb.decode(encodedBlock)
    if (dir.Data == null) {
      throw Error('PBNode Data undefined')
    }
    const dirMetadata = UnixFS.unmarshal(dir.Data)

    expect(dirMetadata.type).to.equal('hamt-sharded-directory')

    const exported = await exporter(dirCid, block)

    expect(exported.cid.toString()).to.be.equal(dirCid.toString())

    if (exported.type !== 'directory') {
      throw new Error('Expected directory')
    }

    if (exported.entries == null) {
      throw new Error('No content found on exported entry')
    }

    const dirFiles = await all(
      map(exported.entries(), async file => ({
        ...await exporter(file.cid, block),
        ...file
      }))
    )
    expect(dirFiles.length).to.equal(Object.keys(files).length)

    for (let i = 0; i < dirFiles.length; i++) {
      const dirFile = dirFiles[i]

      if (dirFile.type !== 'file') {
        throw new Error('Expected file, was ' + dirFile.type)
      }

      const data = uint8ArrayConcat(await all(dirFile.content()))

      // validate the CID
      expect(files[dirFile.name].cid?.toString()).that.deep.equals(dirFile.cid.toString())

      // validate the exported file content
      expect(files[dirFile.name].content).to.deep.equal(data)
    }
  })

  it('exports all files from a sharded directory with subshards', async () => {
    const numFiles = 31
    const dirCid = await createShard(numFiles)
    const exported = await exporter(dirCid, block)

    if (exported.type !== 'directory') {
      throw new Error('Unexpected type')
    }

    expect(exported.unixfs.type).to.equal('hamt-sharded-directory')

    const entries = await all(exported.entries())
    expect(entries.length).to.equal(numFiles)

    for (const entry of entries) {
      const file = await exporter(entry.cid, block)

      if (file.type !== 'file') {
        throw new Error('Unexpected type')
      }

      expect(file.unixfs.type).to.equal('file')
    }
  })

  it('exports one file from a sharded directory', async () => {
    const dirCid = await createShard(31)
    const entry = await last(walkPath(`/ipfs/${dirCid}/file-14`, block))

    if (entry == null) {
      throw new Error('Did not walk path to entry')
    }

    expect(entry).to.have.property('name', 'file-14')

    const exported = await exporter(entry.cid, block)
    expect(exported).to.have.property('type', 'file')
  })

  it('exports one file from a sharded directory sub shard', async () => {
    const dirCid = await createShard(31)
    const entry = await last(walkPath(`/ipfs/${dirCid}/file-30`, block))

    if (entry == null) {
      throw new Error('Did not walk path to entry')
    }

    expect(entry).to.have.property('name', 'file-30')

    const exported = await exporter(entry.cid, block)
    expect(exported).to.have.property('type', 'file')
  })

  it('exports one file from a shard inside a shard inside a shard', async () => {
    const dirCid = await createShard(2568)
    const entry = await last(walkPath(`/ipfs/${dirCid}/file-2567`, block))

    if (entry == null) {
      throw new Error('Did not walk path to entry')
    }

    expect(entry).to.have.property('name', 'file-2567')
  })

  it('extracts a deep folder from the sharded directory', async () => {
    const dirCid = await createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`)
    const entry = await last(walkPath(`/ipfs/${dirCid}/foo/bar/baz`, block))

    if (entry == null) {
      throw new Error('Did not walk path to entry')
    }

    expect(entry).to.have.property('name', 'baz')
  })

  it('extracts an intermediate folder from the sharded directory', async () => {
    const dirCid = await createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`)
    const entry = await last(walkPath(`/ipfs/${dirCid}/foo/bar`, block))

    if (entry == null) {
      throw new Error('Did not walk path to entry')
    }

    expect(entry).to.have.property('name', 'bar')
  })

  it('uses .path to extract all intermediate entries from the sharded directory', async () => {
    const dirCid = await createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`)
    const exported = await all(walkPath(`/ipfs/${dirCid}/foo/bar/baz/file-1`, block))

    expect(exported.length).to.equal(5)

    expect(exported[0].name).to.equal(dirCid.toString())
    expect(exported[1].name).to.equal('foo')
    expect(exported[1].path).to.equal(`${dirCid}/foo`)
    expect(exported[2].name).to.equal('bar')
    expect(exported[2].path).to.equal(`${dirCid}/foo/bar`)
    expect(exported[3].name).to.equal('baz')
    expect(exported[3].path).to.equal(`${dirCid}/foo/bar/baz`)
    expect(exported[4].name).to.equal('file-1')
    expect(exported[4].path).to.equal(`${dirCid}/foo/bar/baz/file-1`)
  })

  it('uses .path to extract all intermediate entries from the sharded directory as well as the contents', async () => {
    const dirCid = await createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`)
    const exported = await all(walkPath(`/ipfs/${dirCid}/foo/bar/baz`, block))

    expect(exported.length).to.equal(4)

    expect(exported[1].name).to.equal('foo')
    expect(exported[2].name).to.equal('bar')
    expect(exported[3].name).to.equal('baz')

    const dir = await exporter(exported[3].cid, block)

    if (dir.type !== 'directory') {
      throw new Error('Expected file')
    }

    const entries = await all(dir.entries())

    expect(entries.length).to.equal(31)

    for (const entry of entries) {
      const file = await exporter(entry.cid, block)
      expect(file).to.have.nested.property('unixfs.type', 'file')
    }
  })

  it('exports a file from a sharded directory inside a regular directory inside a sharded directory', async () => {
    const dirCid = await createShard(15)

    const nodeBlockBuf = dagPb.encode({
      Data: new UnixFS({ type: 'directory' }).marshal(),
      Links: [{
        Name: 'shard',
        Tsize: 5,
        Hash: dirCid
      }]
    })
    const nodeBlockCid = CID.createV0(await sha256.digest(nodeBlockBuf))
    await block.put(nodeBlockCid, nodeBlockBuf)

    const shardNodeBuf = dagPb.encode({
      Data: new UnixFS({ type: 'hamt-sharded-directory', fanout: 2n ** 8n }).marshal(),
      Links: [{
        Name: '75normal-dir',
        Tsize: nodeBlockBuf.length,
        Hash: nodeBlockCid
      }]
    })
    const shardNodeCid = CID.createV0(await sha256.digest(shardNodeBuf))
    await block.put(shardNodeCid, shardNodeBuf)

    const entry = await last(walkPath(`/ipfs/${shardNodeCid}/normal-dir/shard/file-1`, block))

    if (entry == null) {
      throw new Error('Did not walk path to entry')
    }

    expect(entry.name).to.deep.equal('file-1')
  })

  describe('alternate fanout size', function () {
    it('exports a shard with a fanout of 16', async () => {
      const files: ImportCandidate[] = [{
        path: '/baz.txt',
        content: Uint8Array.from([0, 1, 2, 3, 4])
      }, {
        path: '/foo.txt',
        content: Uint8Array.from([0, 1, 2, 3, 4])
      }, {
        path: '/bar.txt',
        content: Uint8Array.from([0, 1, 2, 3, 4])
      }]

      const result = await last(importer(files, block, {
        shardSplitThresholdBytes: 0,
        shardFanoutBits: 4, // 2**4 = 16 children max
        wrapWithDirectory: true
      }))

      if (result == null) {
        throw new Error('Import failed')
      }

      const { cid } = result
      const dir = await exporter(cid, block)

      expect(dir).to.have.nested.property('unixfs.fanout', 16n)

      if (dir.type !== 'directory') {
        throw new Error('Directory expected')
      }

      const entries = await all(map(dir.entries(), async (entry) => {
        const exported = await exporter(entry.cid, block)

        if (exported.type !== 'file' && exported.type !== 'raw') {
          throw new Error('file expected')
        }

        return ({
          path: `/${entry.name}`,
          content: await toBuffer(exported.content())
        })
      }))

      expect(entries)
        .to.deep.equal(files)
    })

    // Cross-impl reference test: directory of files with single character
    // names, starting from ' ' and ending with '~', but excluding the special
    // characters '/' and '.'. Each file should contain a single byte with the
    // same value as the character in its name. Files are added to a sharded
    // directory with a fanout of 16, using CIDv1 throughout, and should result
    // in the root CID of:
    //  bafybeihnipspiyy3dctpcx7lv655qpiuy52d7b2fzs52dtrjqwmvbiux44
    it('reference shard with fanout of 16', async () => {
      const files: ImportCandidate[] = []
      for (let ch = ' '.charCodeAt(0); ch <= '~'.charCodeAt(0); ch++) {
        if (ch === 47 || ch === 46) { // skip '/' and '.'
          continue
        }
        files.push({
          path: String.fromCharCode(ch),
          content: Uint8Array.from([ch])
        })
      }

      const result = await last(importer(files, block, {
        shardSplitThresholdBytes: 0,
        shardFanoutBits: 4,
        wrapWithDirectory: true
      }))

      if (result == null) {
        throw new Error('Import failed')
      }

      const { cid } = result
      expect(cid.toString()).to.equal('bafybeihnipspiyy3dctpcx7lv655qpiuy52d7b2fzs52dtrjqwmvbiux44')

      const dir = await exporter(cid, block)

      if (dir.type !== 'directory') {
        throw new Error('Directory expected')
      }

      expect(dir).to.have.nested.property('unixfs.fanout', 16n)

      const entries = await all(map(dir.entries(), async (entry) => {
        const exported = await exporter(entry.cid, block)

        if (exported.type !== 'file' && exported.type !== 'raw') {
          throw new Error('file expected')
        }

        return ({
          path: `${entry.name}`,
          content: await toBuffer(exported.content())
        })
      }))

      entries.sort((a, b) => a.content[0] < b.content[0] ? -1 : 1)
      expect(entries).to.deep.equal(files)
    })
  })

  it('walks path of a HAMT with a different fanout size', async () => {
    const files: ImportCandidate[] = [{
      path: '/foo/bar/baz.txt',
      content: Uint8Array.from([0, 1, 2, 3, 4])
    }]

    const result = await last(importer(files, block, {
      shardSplitThresholdBytes: 0,
      shardFanoutBits: 4, // 2**4 = 16 children max
      wrapWithDirectory: true
    }))

    if (result == null) {
      throw new Error('Import failed')
    }

    const { cid } = result
    const entry = await last(walkPath(`${cid}/foo/bar/baz.txt`, block))

    if (entry == null) {
      throw new Error('Did not walk path to entry')
    }

    const exported = await exporter(entry?.cid, block)

    if (exported.type !== 'file' && exported.type !== 'raw') {
      throw new Error('Expected file')
    }

    expect([{
      path: entry.path.replace(`${cid}`, ''),
      content: await toBuffer(exported.content())
    }]).to.deep.equal(files)
  })

  it('exports sharded directory', async () => {
    const files: Record<string, { content: Uint8Array, cid?: CID }> = {}

    // needs to result in a block that is larger than SHARD_SPLIT_THRESHOLD bytes
    for (let i = 0; i < 100; i++) {
      files[`file-${Math.random()}.txt`] = {
        content: uint8ArrayConcat(await all(randomBytes(100)))
      }
    }

    const imported = await all(importer(Object.keys(files).map(path => ({
      path,
      content: asAsyncIterable(files[path].content)
    })), block, {
      wrapWithDirectory: true,
      shardSplitThresholdBytes: SHARD_SPLIT_THRESHOLD,
      rawLeaves: false
    }))

    const dirCid = imported.pop()?.cid

    if (dirCid == null) {
      throw new Error('No directory CID found')
    }

    const exported = await exporter(dirCid, block)

    if (exported.type !== 'directory') {
      throw new Error('Directory expected')
    }

    const dirFiles = await all(exported.entries())

    // delete shard contents
    for (const entry of dirFiles) {
      await block.delete(entry.cid)
    }

    // list the contents again, this time just the basic version
    const basicDirFiles = await all(exported.entries())
    expect(basicDirFiles.length).to.equal(dirFiles.length)

    for (let i = 0; i < basicDirFiles.length; i++) {
      const dirFile = basicDirFiles[i]

      expect(dirFile).to.have.property('name')
      expect(dirFile).to.have.property('cid')

      // should fail because we have deleted this block
      await expect(exporter(dirFile.cid, block)).to.eventually.be.rejected()
    }
  })

  it('exports file from sharded directory', async () => {
    const files: Record<string, { content: Uint8Array, cid?: CID }> = {}

    // needs to result in a block that is larger than SHARD_SPLIT_THRESHOLD bytes
    for (let i = 0; i < 100; i++) {
      files[`file-${Math.random()}.txt`] = {
        content: uint8ArrayConcat(await all(randomBytes(100)))
      }
    }

    const imported = await all(importer(Object.keys(files).map(path => ({
      path,
      content: asAsyncIterable(files[path].content)
    })), block, {
      wrapWithDirectory: true,
      shardSplitThresholdBytes: SHARD_SPLIT_THRESHOLD,
      rawLeaves: false
    }))

    const file = imported[0]
    const dir = imported[imported.length - 1]

    const entry = await last(walkPath(`/ipfs/${dir.cid}/${file.path}`, block))

    if (entry == null) {
      throw new Error('Did not walk path')
    }

    const basicFile = await exporter(entry.cid, block)
    expect(basicFile).to.have.property('type', 'file')
    expect(basicFile).to.have.deep.property('cid', file.cid)
    expect(basicFile).to.have.property('unixfs')
    expect(basicFile).to.have.property('content')
  })

  it('includes intermediate shards when asked to do so', async () => {
    await block.put(HAMT_ROOT_CID, HAMT_ROOT_BLOCK)
    await block.put(HAMT_INTERMEDIATE_CID, HAMT_INTERMEDIATE_BLOCK)
    await block.put(HAMT_FILE_CID, HAMT_FILE_BLOCK)

    const cids = await all(map(walkPath(`/ipfs/${HAMT_ROOT_CID}/685.txt`, block, {
      yieldSubShards: true
    }), e => e.cid))

    expect(cids).to.deep.equal([
      HAMT_ROOT_CID,
      HAMT_INTERMEDIATE_CID,
      HAMT_FILE_CID
    ])
  })

  it('walks through intermediate shards without translating path', async () => {
    await block.put(HAMT_ROOT_CID, HAMT_ROOT_BLOCK)
    await block.put(HAMT_INTERMEDIATE_CID, HAMT_INTERMEDIATE_BLOCK)
    await block.put(HAMT_FILE_CID, HAMT_FILE_BLOCK)

    const cids = await all(map(walkPath(`/ipfs/${HAMT_ROOT_CID}/FD/E3685.txt`, block, {
      yieldSubShards: true,
      translateHamtPath: false
    }), e => e.cid))

    expect(cids).to.deep.equal([
      HAMT_ROOT_CID,
      HAMT_INTERMEDIATE_CID,
      HAMT_FILE_CID
    ])
  })
})
