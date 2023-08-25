/* eslint-env mocha */

import * as dagPb from '@ipld/dag-pb'
import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import { UnixFS } from 'ipfs-unixfs'
import { importer, type ImportCandidate } from 'ipfs-unixfs-importer'
import all from 'it-all'
import randomBytes from 'it-buffer-stream'
import last from 'it-last'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { exporter, walkPath } from '../src/index.js'
import asAsyncIterable from './helpers/as-async-iterable.js'

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

    const encodedBlock = await block.get(dirCid)
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

    if (exported.content == null) {
      throw new Error('No content found on exported entry')
    }

    const dirFiles = await all(exported.content())
    expect(dirFiles.length).to.equal(Object.keys(files).length)

    for (let i = 0; i < dirFiles.length; i++) {
      const dirFile = dirFiles[i]

      if (dirFile.type !== 'file') {
        throw new Error('Expected file, was ' + dirFile.type)
      }

      const data = uint8ArrayConcat(await all(dirFile.content()))

      // validate the CID
      // @ts-expect-error - files[dirFile.name].cid is defined
      expect(files[dirFile.name].cid.toString()).that.deep.equals(dirFile.cid.toString())

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
    const exported = await exporter(`/ipfs/${dirCid}/file-14`, block)

    expect(exported).to.have.property('name', 'file-14')
  })

  it('exports one file from a sharded directory sub shard', async () => {
    const dirCid = await createShard(31)
    const exported = await exporter(`/ipfs/${dirCid}/file-30`, block)

    expect(exported.name).to.deep.equal('file-30')
  })

  it('exports one file from a shard inside a shard inside a shard', async () => {
    const dirCid = await createShard(2568)
    const exported = await exporter(`/ipfs/${dirCid}/file-2567`, block)

    expect(exported.name).to.deep.equal('file-2567')
  })

  it('extracts a deep folder from the sharded directory', async () => {
    const dirCid = await createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`)
    const exported = await exporter(`/ipfs/${dirCid}/foo/bar/baz`, block)

    expect(exported.name).to.deep.equal('baz')
  })

  it('extracts an intermediate folder from the sharded directory', async () => {
    const dirCid = await createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`)
    const exported = await exporter(`/ipfs/${dirCid}/foo/bar`, block)

    expect(exported.name).to.deep.equal('bar')
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

    const exported = await exporter(`/ipfs/${shardNodeCid}/normal-dir/shard/file-1`, block)

    expect(exported.name).to.deep.equal('file-1')
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

      const contents = await all(dir.content())

      expect(contents.map(entry => ({
        path: `/${entry.name}`,
        content: entry.node
      })))
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

      expect(dir).to.have.nested.property('unixfs.fanout', 16n)

      let contents = await all(dir.content())
      contents = contents.map(entry => ({
        path: `${entry.name}`,
        content: entry.node
      }))
      contents.sort((a, b) => a.content[0] < b.content[0] ? -1 : 1)
      expect(contents).to.deep.equal(files)
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
    const file = await last(walkPath(`${cid}/foo/bar/baz.txt`, block))
    expect([{
      path: file?.path.replace(`${cid}`, ''),
      content: file?.node
    }]).to.deep.equal(files)
  })
})
