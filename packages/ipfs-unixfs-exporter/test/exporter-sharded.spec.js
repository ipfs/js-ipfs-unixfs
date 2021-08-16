/* eslint-env mocha */
import { expect } from 'aegir/utils/chai.js'
import { UnixFS } from 'ipfs-unixfs'
import all from 'it-all'
import last from 'it-last'
import randomBytes from 'it-buffer-stream'
import { exporter, walkPath } from '../src/index.js'
import { importer } from 'ipfs-unixfs-importer'
import * as dagPb from '@ipld/dag-pb'
import blockApi from './helpers/block.js'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import asAsyncIterable from './helpers/as-async-iterable.js'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'

const SHARD_SPLIT_THRESHOLD = 10

describe('exporter sharded', function () {
  this.timeout(30000)

  const block = blockApi()

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
      content: asAsyncIterable(Uint8Array.from([0, 1, 2, 3, 4, index]))
    }))

    return createShardWithFiles(files)
  }

  /**
   * @param {{ path: string, content: AsyncIterable<Uint8Array> }[] } files
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
      content: asAsyncIterable(files[path].content)
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

    const encodedBlock = await block.get(dirCid)
    const dir = dagPb.decode(encodedBlock)
    if (!dir.Data) {
      throw Error('PBNode Data undefined')
    }
    const dirMetadata = UnixFS.unmarshal(dir.Data)

    expect(dirMetadata.type).to.equal('hamt-sharded-directory')

    const exported = await exporter(dirCid, block)

    expect(exported.cid.toString()).to.be.equal(dirCid.toString())

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
      // @ts-ignore - files[dirFile.name].cid is defined
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
      Data: new UnixFS({ type: 'hamt-sharded-directory' }).marshal(),
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
})
