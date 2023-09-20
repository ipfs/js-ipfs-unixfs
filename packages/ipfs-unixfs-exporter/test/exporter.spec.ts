/* eslint-env mocha */

import * as dagCbor from '@ipld/dag-cbor'
import * as dagPb from '@ipld/dag-pb'
import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import delay from 'delay'
import { UnixFS } from 'ipfs-unixfs'
import { importer } from 'ipfs-unixfs-importer'
import { fixedSize } from 'ipfs-unixfs-importer/chunker'
import { balanced, type FileLayout, flat, trickle } from 'ipfs-unixfs-importer/layout'
import all from 'it-all'
import randomBytes from 'it-buffer-stream'
import first from 'it-first'
import last from 'it-last'
import toBuffer from 'it-to-buffer'
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { identity } from 'multiformats/hashes/identity'
import { sha256 } from 'multiformats/hashes/sha2'
import { Readable } from 'readable-stream'
import Sinon from 'sinon'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { isNode } from 'wherearewe'
import { exporter, recursive } from '../src/index.js'
import asAsyncIterable from './helpers/as-async-iterable.js'
import type { PBNode } from '@ipld/dag-pb'
import type { Blockstore } from 'interface-blockstore'
import type { Chunker } from 'ipfs-unixfs-importer/chunker'

const ONE_MEG = Math.pow(1024, 2)

describe('exporter', () => {
  const block = new MemoryBlockstore()
  let bigFile: Uint8Array
  let smallFile: Uint8Array

  before(async () => {
    bigFile = uint8ArrayConcat(await all(randomBytes(ONE_MEG * 1.2)))
    smallFile = uint8ArrayConcat(await all(randomBytes(200)))
  })

  async function dagPut (options: { type?: string, content?: Uint8Array, links?: dagPb.PBLink[] } = {}): Promise<{ file: UnixFS, node: PBNode, cid: CID }> {
    options.type = options.type ?? 'file'
    options.content = options.content ?? Uint8Array.from([0x01, 0x02, 0x03])
    options.links = options.links ?? []

    const file = new UnixFS({
      type: options.type,
      data: options.content,
      blockSizes: options.links.map(l => BigInt(l.Tsize ?? 0))
    })
    const node = {
      Data: file.marshal(),
      Links: options.links
    }
    const buf = dagPb.encode(node)
    const cid = CID.createV0(await sha256.digest(buf))
    await block.put(cid, buf)

    return { file, node, cid }
  }

  async function addTestFile (options: { file: Uint8Array, layout?: FileLayout, chunker?: Chunker, path?: string, rawLeaves?: boolean }): Promise<CID> {
    const { file, path = '/foo', layout, chunker, rawLeaves } = options

    const result = await all(importer([{
      path,
      content: asAsyncIterable(file)
    }], block, {
      layout,
      chunker,
      rawLeaves
    }))

    return result[0].cid
  }

  async function addAndReadTestFile (options: { file: Uint8Array, offset?: number, length?: number, layout?: FileLayout, chunker?: Chunker, path?: string, rawLeaves?: boolean }): Promise<Uint8Array> {
    const { file, offset, length, layout, path = '/foo', chunker, rawLeaves } = options
    const cid = await addTestFile({ file, layout, path, chunker, rawLeaves })
    const entry = await exporter(cid, block)

    if (entry.type !== 'file' && entry.type !== 'raw') {
      throw new Error('Unexpected type')
    }

    return uint8ArrayConcat(await all(entry.content({
      offset, length
    })))
  }

  async function checkBytesThatSpanBlocks (layout: FileLayout): Promise<void> {
    const bytesInABlock = 262144
    const bytes = new Uint8Array(bytesInABlock + 100)

    bytes[bytesInABlock - 1] = 1
    bytes[bytesInABlock] = 2
    bytes[bytesInABlock + 1] = 3

    const data = await addAndReadTestFile({
      file: bytes,
      offset: bytesInABlock - 1,
      length: 3,
      layout
    })

    expect(data).to.deep.equal(Uint8Array.from([1, 2, 3]))
  }

  async function createAndPersistNode (type: 'file' | 'directory' | 'raw', data: Uint8Array | ArrayLike<number> | undefined, children: Array<{ node: PBNode, cid: CID }>): Promise<{ node: PBNode, cid: CID }> {
    const file = new UnixFS({ type, data: (data != null) ? Uint8Array.from(data) : undefined })
    const links = []

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      // @ts-expect-error - we can guarantee that it's not undefined
      const leaf = UnixFS.unmarshal(child.node.Data)

      file.addBlockSize(leaf.fileSize())

      links.push({
        Name: '',
        Tsize: child.node.Data != null ? child.node.Data.length : 0,
        Hash: child.cid
      })
    }

    const node = {
      Data: file.marshal(),
      Links: links
    }

    const nodeBlock = dagPb.encode(node)
    const nodeCid = CID.createV0(await sha256.digest(nodeBlock))
    await block.put(nodeCid, nodeBlock)

    return {
      node,
      cid: nodeCid
    }
  }

  it('ensure hash inputs are sanitized', async () => {
    const result = await dagPut()
    const encodedBlock = await block.get(result.cid)
    const node = dagPb.decode(encodedBlock)
    if (node.Data == null) {
      throw new Error('PBNode Data undefined')
    }
    const unmarsh = UnixFS.unmarshal(node.Data)

    expect(unmarsh.data).to.deep.equal(result.file.data)

    const file = await exporter(result.cid, block)

    expect(file).to.have.property('cid')
    expect(file).to.have.property('path', result.cid.toString())

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(file.content()))
    expect(data).to.deep.equal(unmarsh.data)
  })

  it('small file in a directory with an escaped slash in the title', async () => {
    const fileName = `small-\\/file-${Math.random()}.txt`
    const filePath = `/foo/${fileName}`

    const files = await all(importer([{
      path: filePath,
      content: asAsyncIterable(smallFile)
    }], block))

    const path = `/ipfs/${files[1].cid}/${fileName}`
    const file = await exporter(path, block)

    expect(file.name).to.equal(fileName)
    expect(file.path).to.equal(`${files[1].cid}/${fileName}`)
  })

  it('small file in a directory with an square brackets in the title', async () => {
    const fileName = `small-[bar]-file-${Math.random()}.txt`
    const filePath = `/foo/${fileName}`

    const files = await all(importer([{
      path: filePath,
      content: asAsyncIterable(smallFile)
    }], block))

    const path = `/ipfs/${files[1].cid}/${fileName}`
    const file = await exporter(path, block)

    expect(file.name).to.equal(fileName)
    expect(file.path).to.equal(`${files[1].cid}/${fileName}`)
  })

  it('exports a chunk of a file with no links', async () => {
    const offset = 0
    const length = 5

    const result = await dagPut({
      content: uint8ArrayConcat(await all(randomBytes(100)))
    })

    const encodedBlock = await block.get(result.cid)
    const node = dagPb.decode(encodedBlock)
    if (node.Data == null) {
      throw new Error('PBNode Data undefined')
    }
    const unmarsh = UnixFS.unmarshal(node.Data)

    if (unmarsh.data == null) {
      throw new Error('Unexpected data')
    }

    const file = await exporter(result.cid, block)

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(file.content({
      offset,
      length
    })))

    expect(data).to.deep.equal(unmarsh.data.slice(offset, offset + length))
  })

  it('exports a small file with links', async () => {
    const content = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    const chunk1 = new UnixFS({
      type: 'raw',
      data: content.slice(0, 5)
    })
    const chunkNode1 = {
      Data: chunk1.marshal(),
      Links: []
    }
    const chunkBlock1 = dagPb.encode(chunkNode1)
    const chunkCid1 = CID.createV0(await sha256.digest(chunkBlock1))
    await block.put(chunkCid1, chunkBlock1)

    const chunk2 = new UnixFS({ type: 'raw', data: content.slice(5) })
    const chunkNode2 = {
      Data: chunk2.marshal(),
      Links: []
    }
    const chunkBlock2 = dagPb.encode(chunkNode2)
    const chunkCid2 = CID.createV0(await sha256.digest(chunkBlock2))
    await block.put(chunkCid2, chunkBlock2)

    const file = new UnixFS({
      type: 'file'
    })
    file.addBlockSize(5n)
    file.addBlockSize(5n)

    const fileNode = dagPb.prepare({
      Data: file.marshal(),
      Links: [{
        Name: '',
        Tsize: chunkNode1.Data != null ? chunkNode1.Data.length : 0,
        Hash: chunkCid1.toV0()
      }, {
        Name: '',
        Tsize: chunkNode2.Data != null ? chunkNode2.Data.length : 0,
        Hash: chunkCid2.toV0()
      }]
    })
    const fileBlock = dagPb.encode(fileNode)
    const fileCid = CID.createV0(await sha256.digest(fileBlock))
    await block.put(fileCid, fileBlock)

    const exported = await exporter(fileCid, block)

    if (exported.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(exported.content()))
    expect(data).to.deep.equal(content)
  })

  it('exports a chunk of a small file with links', async () => {
    const offset = 0
    const length = 5

    const chunk = await dagPut({ content: uint8ArrayConcat(await all(randomBytes(100))) })
    const result = await dagPut({
      content: uint8ArrayConcat(await all(randomBytes(100))),
      links: [{
        Name: '',
        Tsize: chunk.node.Data != null ? chunk.node.Data.length : 0,
        Hash: chunk.cid
      }]
    })

    if (result.file.data == null) {
      throw new Error('Expected data')
    }

    const file = await exporter(result.cid, block)

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(file.content({
      offset,
      length
    })))

    expect(data).to.deep.equal(result.file.data.slice(offset, offset + length))
  })

  it('exports a file in lots of blocks and a slow blockstore', async function () {
    this.timeout(30 * 1000)

    const data = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])

    const cid = await addTestFile({
      file: data,
      chunker: fixedSize({
        chunkSize: 2
      })
    })

    // @ts-expect-error incomplete implementation
    const blockStore: Blockstore = {
      ...block,
      async get (cid: CID) {
        await delay(Math.random() * 10)

        return block.get(cid)
      }
    }

    const file = await exporter(cid, blockStore)

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const bytes = uint8ArrayConcat(await all(file.content()))

    expect(data).to.equalBytes(bytes)
  })

  it('exports a large file > 5mb', async function () {
    this.timeout(30 * 1000)

    const cid = await addTestFile({
      file: uint8ArrayConcat(await all(randomBytes(ONE_MEG * 6)))
    })

    const file = await exporter(cid, block)

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    expect(file).to.have.property('path', cid.toString())
    expect(file.unixfs.fileSize()).to.equal(BigInt(ONE_MEG * 6))
  })

  it('exports a chunk of a large file > 5mb', async function () {
    this.timeout(30 * 1000)

    const offset = 0
    const length = 5
    const bytes = uint8ArrayConcat(await all(randomBytes(ONE_MEG * 6)))

    const cid = await addTestFile({
      file: bytes
    })

    const file = await exporter(cid, block)
    expect(file).to.have.property('path', cid.toString())

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(file.content({
      offset,
      length
    })))

    expect(data).to.deep.equal(bytes.slice(offset, offset + length))
  })

  it('exports the right chunks of files when offsets are specified', async function () {
    this.timeout(30 * 1000)
    const offset = 3
    const data = new Uint8Array(300 * 1024)

    const fileWithNoOffset = await addAndReadTestFile({
      file: data,
      offset: 0
    })

    const fileWithOffset = await addAndReadTestFile({
      file: data,
      offset
    })

    expect(fileWithNoOffset.length).to.equal(data.length)
    expect(fileWithNoOffset.length - fileWithOffset.length).to.equal(offset)
    expect(fileWithOffset.length).to.equal(data.length - offset)
    expect(fileWithNoOffset.length).to.equal(fileWithOffset.length + offset)
  })

  it('exports a zero length chunk of a large file', async function () {
    this.timeout(30 * 1000)

    const data = await addAndReadTestFile({
      file: bigFile,
      path: '1.2MiB.txt',
      rawLeaves: true,
      length: 0
    })

    expect(data).to.eql(new Uint8Array(0))
  })

  it('exports a directory', async () => {
    const importedDir = await last(importer([{
      path: './200Bytes.txt',
      content: randomBytes(ONE_MEG)
    }, {
      path: './dir-another'
    }, {
      path: './level-1/200Bytes.txt',
      content: randomBytes(ONE_MEG)
    }, {
      path: './level-1/level-2'
    }], block))

    if (importedDir == null) {
      throw new Error('Nothing imported')
    }

    const dir = await exporter(importedDir.cid, block)

    if (dir.type !== 'directory') {
      throw new Error('Unexpected type')
    }

    const files = await all(dir.content())

    files.forEach(file => expect(file).to.have.property('cid'))

    expect(
      files.map((file) => file.path)
    ).to.be.eql([
      `${dir.cid}/200Bytes.txt`,
      `${dir.cid}/dir-another`,
      `${dir.cid}/level-1`
    ])

    files
      .filter(file => file.type === 'directory' && file.unixfs.type === 'dir')
      .forEach(dir => {
        expect(dir).to.has.property('size', 0)
      })

    expect(
      files
        .map(file => file.type === 'file' && file.unixfs.type === 'file')
    ).to.deep.equal([
      true,
      false,
      false
    ])
  })

  it('exports a directory one deep', async () => {
    const importedDir = await last(importer([{
      path: './200Bytes.txt',
      content: randomBytes(ONE_MEG)
    }, {
      path: './dir-another'
    }, {
      path: './level-1'
    }], block))

    if (importedDir == null) {
      throw new Error('Nothing imported')
    }

    const dir = await exporter(importedDir.cid, block)

    if (dir.type !== 'directory') {
      throw new Error('Unexpected type')
    }

    const files = await all(dir.content())

    files.forEach(file => expect(file).to.have.property('cid'))

    expect(
      files.map((file) => file.path)
    ).to.be.eql([
      `${importedDir.cid}/200Bytes.txt`,
      `${importedDir.cid}/dir-another`,
      `${importedDir.cid}/level-1`
    ])

    expect(
      files
        .map(file => file.type === 'file' && file.unixfs.type === 'file')
    ).to.deep.equal([
      true,
      false,
      false
    ])
  })

  it('exports a small file imported with raw leaves', async function () {
    this.timeout(30 * 1000)

    const data = await addAndReadTestFile({
      file: smallFile,
      path: '200Bytes.txt',
      rawLeaves: true
    })

    expect(data).to.deep.equal(smallFile)
  })

  it('exports a chunk of a small file imported with raw leaves', async function () {
    this.timeout(30 * 1000)

    const length = 100

    const data = await addAndReadTestFile({
      file: smallFile,
      path: '200Bytes.txt',
      rawLeaves: true,
      length
    })

    expect(data).to.eql(smallFile.slice(0, length))
  })

  it('exports a chunk of a small file imported with raw leaves with length', async function () {
    this.timeout(30 * 1000)

    const offset = 100
    const length = 200

    const data = await addAndReadTestFile({
      file: smallFile,
      path: '200Bytes.txt',
      rawLeaves: true,
      offset,
      length
    })

    expect(data).to.eql(smallFile.slice(offset))
  })

  it('exports a zero length chunk of a small file imported with raw leaves', async function () {
    this.timeout(30 * 1000)

    const length = 0

    const data = await addAndReadTestFile({
      file: smallFile,
      path: '200Bytes.txt',
      rawLeaves: true,
      length
    })

    expect(data).to.eql(new Uint8Array(0))
  })

  it('errors when exporting a chunk of a small file imported with raw leaves and negative length', async function () {
    this.timeout(30 * 1000)

    const length = -100

    try {
      await addAndReadTestFile({
        file: smallFile,
        path: '200Bytes.txt',
        rawLeaves: true,
        length
      })
      throw new Error('Should not have got this far')
    } catch (err: any) {
      expect(err.message).to.equal('Length must be greater than or equal to 0')
      expect(err.code).to.equal('ERR_INVALID_PARAMS')
    }
  })

  it('errors when exporting a chunk of a small file imported with raw leaves and negative offset', async function () {
    this.timeout(30 * 1000)

    const offset = -100

    try {
      await addAndReadTestFile({
        file: smallFile,
        path: '200Bytes.txt',
        rawLeaves: true,
        offset
      })
      throw new Error('Should not have got this far')
    } catch (err: any) {
      expect(err.message).to.equal('Offset must be greater than or equal to 0')
      expect(err.code).to.equal('ERR_INVALID_PARAMS')
    }
  })

  it('errors when exporting a chunk of a small file imported with raw leaves and offset greater than file size', async function () {
    this.timeout(30 * 1000)

    const offset = 201

    try {
      await addAndReadTestFile({
        file: smallFile,
        path: '200Bytes.txt',
        rawLeaves: true,
        offset
      })
      throw new Error('Should not have got this far')
    } catch (err: any) {
      expect(err.message).to.equal('Offset must be less than the file size')
      expect(err.code).to.equal('ERR_INVALID_PARAMS')
    }
  })

  it('exports a large file > 1mb imported with raw leaves', async () => {
    const imported = await first(importer([{
      path: '1.2MiB.txt',
      content: asAsyncIterable(bigFile)
    }], block, {
      rawLeaves: true
    }))

    if (imported == null) {
      throw new Error('Nothing imported')
    }

    const file = await exporter(imported.cid, block)

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(file.content()))

    expect(data).to.deep.equal(bigFile)
  })

  it('reads an empty file', async () => {
    const data = await addAndReadTestFile({
      file: new Uint8Array()
    })

    expect(data).to.have.property('byteLength', 0)
  })

  it('returns an empty stream for dir', async () => {
    const imported = await all(importer([{
      path: 'empty'
    }], block))

    if (imported == null) {
      throw new Error('Nothing imported')
    }

    const dir = await exporter(imported[0].cid, block)

    if (dir.type !== 'directory') {
      throw new Error('Unexpected type')
    }

    const files = await all(dir.content())
    expect(files.length).to.equal(0)
  })

  it('reads bytes with an offset', async () => {
    const data = await addAndReadTestFile({
      file: Uint8Array.from([0, 1, 2, 3]),
      offset: 1
    })

    expect(data).to.deep.equal(Uint8Array.from([1, 2, 3]))
  })

  it('errors when reading bytes with a negative offset', async () => {
    try {
      await addAndReadTestFile({
        file: Uint8Array.from([0, 1, 2, 3]),
        offset: -1
      })
      throw new Error('Should not have got this far')
    } catch (err: any) {
      expect(err.message).to.contain('Offset must be greater than or equal to 0')
      expect(err.code).to.equal('ERR_INVALID_PARAMS')
    }
  })

  it('reads bytes with an offset and a length', async () => {
    const data = await addAndReadTestFile({
      file: Uint8Array.from([0, 1, 2, 3]),
      offset: 0,
      length: 1
    })

    expect(data).to.deep.equal(Uint8Array.from([0]))
  })

  it('reads returns an empty buffer when offset is equal to the file size', async () => {
    const data = await addAndReadTestFile({
      file: Uint8Array.from([0, 1, 2, 3]),
      offset: 4
    })

    expect(data).to.be.empty()
  })

  it('reads returns an empty buffer when length is zero', async () => {
    const data = await addAndReadTestFile({
      file: Uint8Array.from([0, 1, 2, 3]),
      length: 0
    })

    expect(data).to.be.empty()
  })

  it('errors when reading bytes with a negative length', async () => {
    try {
      await addAndReadTestFile({
        file: Uint8Array.from([0, 1, 2, 3, 4]),
        offset: 2,
        length: -1
      })
    } catch (err: any) {
      expect(err.message).to.contain('Length must be greater than or equal to 0')
      expect(err.code).to.equal('ERR_INVALID_PARAMS')
    }
  })

  it('errors when reading bytes that start after the file ends', async () => {
    try {
      await addAndReadTestFile({
        file: Uint8Array.from([0, 1, 2, 3, 4]),
        offset: 200
      })
    } catch (err: any) {
      expect(err.message).to.contain('Offset must be less than the file size')
      expect(err.code).to.equal('ERR_INVALID_PARAMS')
    }
  })

  it('reads bytes with an offset and a length', async () => {
    const data = await addAndReadTestFile({
      file: Uint8Array.from([0, 1, 2, 3, 4]),
      offset: 1,
      length: 4
    })

    expect(data).to.deep.equal(Uint8Array.from([1, 2, 3, 4]))
  })

  it('reads files that are split across lots of nodes', async function () {
    this.timeout(30 * 1000)

    const data = await addAndReadTestFile({
      file: bigFile,
      offset: 0,
      length: bigFile.length,
      chunker: fixedSize({
        chunkSize: 1024
      })
    })

    expect(data).to.deep.equal(bigFile)
  })

  it('reads files in multiple steps that are split across lots of nodes in really small chunks', async function () {
    this.timeout(600 * 1000)

    const results = []
    const chunkSize = 1024
    let offset = 0

    const cid = await addTestFile({
      file: bigFile,
      chunker: fixedSize({
        chunkSize: 1024
      })
    })
    const file = await exporter(cid, block)

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    while (offset < bigFile.length) {
      const result = uint8ArrayConcat(await all(file.content({
        offset,
        length: chunkSize
      })))
      results.push(result)

      offset += result.length
    }

    const buffer = uint8ArrayConcat(results)

    expect(buffer).to.deep.equal(bigFile)
  })

  it('reads bytes with an offset and a length that span blocks using balanced layout', async () => {
    await checkBytesThatSpanBlocks(balanced())
  })

  it('reads bytes with an offset and a length that span blocks using flat layout', async () => {
    await checkBytesThatSpanBlocks(flat())
  })

  it('reads bytes with an offset and a length that span blocks using trickle layout', async () => {
    await checkBytesThatSpanBlocks(trickle())
  })

  it('fails on non existent hash', async () => {
    // This hash doesn't exist in the repo
    const hash = 'bafybeidu2qqwriogfndznz32swi5r4p2wruf6ztu5k7my53tsezwhncs5y'

    try {
      await exporter(hash, block)
    } catch (err: any) {
      expect(err.code).to.equal('ERR_NOT_FOUND')
    }
  })

  it('exports file with data on internal and leaf nodes', async () => {
    const leaf = await createAndPersistNode('raw', [0x04, 0x05, 0x06, 0x07], [])
    const node = await createAndPersistNode('file', [0x00, 0x01, 0x02, 0x03], [
      leaf
    ])

    const file = await exporter(node.cid, block)

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(file.content()))

    expect(data).to.deep.equal(Uint8Array.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]))
  })

  it('exports file with data on some internal and leaf nodes', async () => {
    // create a file node with three children:
    // where:
    //   i = internal node without data
    //   d = internal node with data
    //   l = leaf node with data
    //             i
    //          /  |  \
    //         l   d   i
    //             |     \
    //             l      l
    const leaves = await Promise.all([
      createAndPersistNode('raw', [0x00, 0x01, 0x02, 0x03], []),
      createAndPersistNode('raw', [0x08, 0x09, 0x10, 0x11], []),
      createAndPersistNode('raw', [0x12, 0x13, 0x14, 0x15], [])
    ])

    const internalNodes = await Promise.all([
      createAndPersistNode('raw', [0x04, 0x05, 0x06, 0x07], [leaves[1]]),
      createAndPersistNode('raw', undefined, [leaves[2]])
    ])

    const node = await createAndPersistNode('file', undefined, [
      leaves[0],
      internalNodes[0],
      internalNodes[1]
    ])

    const file = await exporter(node.cid, block)

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(file.content()))

    expect(data).to.deep.equal(
      Uint8Array.from([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0x08, 0x09, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15
      ])
    )
  })

  // this is not in the spec?
  it.skip('exports file with data on internal and leaf nodes with an offset that only fetches data from leaf nodes', async () => {
    const leaf = await createAndPersistNode('raw', [0x04, 0x05, 0x06, 0x07], [])
    const node = await createAndPersistNode('file', [0x00, 0x01, 0x02, 0x03], [
      leaf
    ])

    const file = await exporter(node.cid, block)

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(file.content({
      offset: 4
    })))

    expect(data).to.deep.equal(Uint8Array.from([0x04, 0x05, 0x06, 0x07]))
  })

  it('exports file with data on leaf nodes without emitting empty buffers', async function () {
    this.timeout(30 * 1000)

    const imported = await first(importer([{
      path: '200Bytes.txt',
      content: asAsyncIterable(bigFile)
    }], block, {
      rawLeaves: true
    }))

    if (imported == null) {
      throw new Error('Nothing imported')
    }

    const file = await exporter(imported.cid, block)

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const buffers = await all(file.content())

    buffers.forEach(buffer => {
      expect(buffer.length).to.not.equal(0)
    })
  })

  it('exports a raw leaf', async () => {
    const imported = await first(importer([{
      path: '200Bytes.txt',
      content: asAsyncIterable(smallFile)
    }], block, {
      rawLeaves: true
    }))

    if (imported == null) {
      throw new Error('Nothing imported')
    }

    const file = await exporter(imported.cid, block)
    expect(CID.asCID(file.cid)).to.not.be.undefined()

    if (file.type !== 'raw') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(file.content()))
    expect(data).to.deep.equal(smallFile)
  })

  it('errors when exporting a non-existent key from a cbor node', async () => {
    const node = {
      foo: 'bar'
    }

    const cborBlock = dagCbor.encode(node)
    const cid = CID.createV1(dagCbor.code, await sha256.digest(cborBlock))
    await block.put(cid, cborBlock)

    try {
      await exporter(`${cid}/baz`, block)
    } catch (err: any) {
      expect(err.code).to.equal('ERR_NO_PROP')
    }
  })

  it('exports a cbor node', async () => {
    const node = {
      foo: 'bar'
    }

    const cborBlock = dagCbor.encode(node)
    const cid = CID.createV1(dagCbor.code, await sha256.digest(cborBlock))
    await block.put(cid, cborBlock)
    const exported = await exporter(`${cid}`, block)

    if (exported.type !== 'object') {
      throw new Error('Unexpected type')
    }

    return expect(first(exported.content())).to.eventually.deep.equal(node)
  })

  it('errors when exporting a node with no resolver', async () => {
    const cid = CID.create(1, 0x78, CID.parse('zdj7WkRPAX9o9nb9zPbXzwG7JEs78uyhwbUs8JSUayB98DWWY').multihash)

    try {
      await exporter(`${cid}`, block)
    } catch (err: any) {
      expect(err.code).to.equal('ERR_NO_RESOLVER')
    }
  })

  it('errors if we try to export links from inside a raw node', async () => {
    const rawBlock = Uint8Array.from([0, 1, 2, 3, 4])
    const cid = CID.createV1(raw.code, await sha256.digest(rawBlock))
    await block.put(cid, rawBlock)

    try {
      await exporter(`${cid}/lol`, block)
    } catch (err: any) {
      expect(err.code).to.equal('ERR_NOT_FOUND')
    }
  })

  it('errors we export a non-unixfs dag-pb node', async () => {
    const dagpbBlock = dagPb.encode({
      Data: Uint8Array.from([0, 1, 2, 3, 4]),
      Links: []
    })
    const dagpbCid = CID.createV0(await sha256.digest(dagpbBlock))
    await block.put(dagpbCid, dagpbBlock)

    try {
      await exporter(dagpbCid, block)
    } catch (err: any) {
      expect(err.code).to.equal('ERR_NOT_UNIXFS')
    }
  })

  it('errors we export a unixfs node that has a non-unixfs/dag-pb child', async () => {
    const cborBlock = dagCbor.encode({ foo: 'bar' })
    const cborCid = CID.createV1(dagCbor.code, await sha256.digest(cborBlock))
    await block.put(cborCid, cborBlock)

    const file = new UnixFS({
      type: 'file'
    })
    file.addBlockSize(100n)

    const dagpbBuffer = dagPb.encode({
      Data: file.marshal(),
      Links: [{
        Name: '',
        Tsize: cborBlock.length,
        Hash: cborCid
      }]
    })
    const dagpbCid = CID.createV0(await sha256.digest(dagpbBuffer))
    await block.put(dagpbCid, dagpbBuffer)

    const exported = await exporter(dagpbCid, block)

    if (exported.type !== 'file') {
      throw new Error('Unexpected type')
    }

    try {
      await all(exported.content())
    } catch (err: any) {
      expect(err.code).to.equal('ERR_NOT_UNIXFS')
    }
  })

  it('exports a node with depth', async () => {
    const imported = await all(importer([{
      path: '/foo/bar/baz.txt',
      content: asAsyncIterable(uint8ArrayFromString('hello world'))
    }], block))

    const exported = await exporter(imported[0].cid, block)

    expect(exported.depth).to.equal(0)
  })

  it('exports a node recursively with depth', async () => {
    const dir = await last(importer([{
      path: '/foo/bar/baz.txt',
      content: asAsyncIterable(uint8ArrayFromString('hello world'))
    }, {
      path: '/foo/qux.txt',
      content: asAsyncIterable(uint8ArrayFromString('hello world'))
    }, {
      path: '/foo/bar/quux.txt',
      content: asAsyncIterable(uint8ArrayFromString('hello world'))
    }], block))

    if (dir == null) {
      throw new Error('Nothing imported')
    }

    const exported = await all(recursive(dir.cid, block))
    const dirCid = dir.cid.toString()

    expect(exported[0].depth).to.equal(0)
    expect(exported[0].name).to.equal(dirCid)

    expect(exported[1].depth).to.equal(1)
    expect(exported[1].name).to.equal('bar')
    expect(exported[1].path).to.equal(`${dirCid}/bar`)

    expect(exported[2].depth).to.equal(2)
    expect(exported[2].name).to.equal('baz.txt')
    expect(exported[2].path).to.equal(`${dirCid}/bar/baz.txt`)

    expect(exported[3].depth).to.equal(2)
    expect(exported[3].name).to.equal('quux.txt')
    expect(exported[3].path).to.equal(`${dirCid}/bar/quux.txt`)

    expect(exported[4].depth).to.equal(1)
    expect(exported[4].name).to.equal('qux.txt')
    expect(exported[4].path).to.equal(`${dirCid}/qux.txt`)
  })

  it('exports a CID encoded with the identity hash', async () => {
    const data = uint8ArrayFromString('hello world')
    const hash = identity.digest(data)
    const cid = CID.create(1, identity.code, hash)

    const exported = await exporter(cid, block)

    if (exported.type !== 'identity') {
      throw new Error('Unexpected type')
    }

    const result = uint8ArrayConcat(await all(exported.content()))

    expect(result).to.deep.equal(data)
    expect(uint8ArrayToString(result)).to.equal('hello world')
  })

  it('exports a CID encoded with the identity hash with an offset', async () => {
    const data = uint8ArrayFromString('hello world')
    const hash = identity.digest(data)
    const cid = CID.create(1, identity.code, hash)

    const exported = await exporter(cid, block)

    if (exported.type !== 'identity') {
      throw new Error('Unexpected type')
    }

    const result = uint8ArrayConcat(await all(exported.content({
      offset: 1
    })))

    expect(uint8ArrayToString(result)).to.equal('ello world')
  })

  it('exports a CID encoded with the identity hash with a length', async () => {
    const data = uint8ArrayFromString('hello world')
    const hash = identity.digest(data)
    const cid = CID.create(1, identity.code, hash)

    const exported = await exporter(cid, block)

    if (exported.type !== 'identity') {
      throw new Error('Unexpected type')
    }

    const result = uint8ArrayConcat(await all(exported.content({
      length: 1
    })))

    expect(uint8ArrayToString(result)).to.equal('h')
  })

  it('exports a CID encoded with the identity hash with an offset and a length', async () => {
    const data = uint8ArrayFromString('hello world')
    const hash = identity.digest(data)
    const cid = CID.create(1, identity.code, hash)

    const exported = await exporter(cid, block)

    if (exported.type !== 'identity') {
      throw new Error('Unexpected type')
    }

    const result = uint8ArrayConcat(await all(exported.content({
      offset: 3,
      length: 1
    })))

    expect(uint8ArrayToString(result)).to.equal('l')
  })

  it('aborts a request', async () => {
    const abortController = new AbortController()

    // data should not be in IPLD
    const data = uint8ArrayFromString(`hello world '${Math.random()}`)
    const hash = await sha256.digest(data)
    const cid = CID.create(1, dagPb.code, hash)
    const message = `User aborted ${Math.random()}`

    setTimeout(() => {
      abortController.abort()
    }, 100)

    // regular test IPLD is offline-only, we need to mimic what happens when
    // we try to get a block from the network
    const customBlock = {
      get: async (cid: CID, options: { signal: AbortSignal }) => {
        // promise will never resolve, so reject it when the abort signal is sent
        return new Promise((resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            reject(new Error(message))
          })
        })
      }
    }

    // @ts-expect-error ipld implementation incomplete
    await expect(exporter(cid, customBlock, {
      signal: abortController.signal
    })).to.eventually.be.rejectedWith(message)
  })

  it('should support being used with readable-stream', async () => {
    if (!isNode) {
      // node-only test
      return
    }

    let dataSizeInBytes = 10

    // iterate through order of magnitude in size until hitting 10MB
    while (dataSizeInBytes <= 10_000_000) {
      const bytes = await toBuffer(randomBytes(dataSizeInBytes))

      // chunk up the bytes to simulate a more real-world like behavior
      const chunkLength = 100_000
      let currentIndex = 0

      const readableStream = new Readable({
        read (): void {
          // if this is the last chunk
          if (currentIndex + chunkLength > bytes.length) {
            this.push(bytes.subarray(currentIndex))
            this.push(null)
          } else {
            this.push(bytes.subarray(currentIndex, currentIndex + chunkLength))

            currentIndex = currentIndex + chunkLength
          }
        }
      })

      const result = await last(importer([{
        content: readableStream
      }], block))

      if (result == null) {
        throw new Error('Import failed')
      }

      const file = await exporter(result.cid, block)
      const contentIterator = file.content()

      const readableStreamToBytes = async (readableStream: Readable): Promise<Uint8Array> => {
        return new Promise((resolve, reject) => {
          const chunks: any[] = []
          readableStream.on('data', chunk => {
            chunks.push(chunk)
          })

          readableStream.on('end', () => {
            const uint8Array = uint8ArrayConcat(chunks)
            resolve(uint8Array)
          })

          readableStream.on('error', reject)
        })
      }

      const dataStream = new Readable({
        async read (): Promise<void> {
          const result = await contentIterator.next()
          if (result.done === true) {
            this.push(null) // end the stream
          } else {
            this.push(result.value)
          }
        }
      })

      const data = await readableStreamToBytes(dataStream)

      expect(data.byteLength).to.equal(dataSizeInBytes)
      expect(data).to.equalBytes(bytes)

      dataSizeInBytes *= 10
    }
  })

  it('should allow control of block read concurrency', async () => {
    // create a multi-layered DAG of a manageable size
    const imported = await first(importer([{
      path: '1.2MiB.txt',
      content: asAsyncIterable(smallFile)
    }], block, {
      rawLeaves: true,
      chunker: fixedSize({ chunkSize: 50 }),
      layout: balanced({ maxChildrenPerNode: 2 })
    }))

    if (imported == null) {
      throw new Error('Nothing imported')
    }

    const node = dagPb.decode(await block.get(imported.cid))
    expect(node.Links).to.have.lengthOf(2, 'imported node had too many children')

    const child1 = dagPb.decode(await block.get(node.Links[0].Hash))
    expect(child1.Links).to.have.lengthOf(2, 'layer 1 node had too many children')

    const child2 = dagPb.decode(await block.get(node.Links[1].Hash))
    expect(child2.Links).to.have.lengthOf(2, 'layer 1 node had too many children')

    // should be raw nodes
    expect(child1.Links[0].Hash.code).to.equal(raw.code, 'layer 2 node had wrong codec')
    expect(child1.Links[1].Hash.code).to.equal(raw.code, 'layer 2 node had wrong codec')
    expect(child2.Links[0].Hash.code).to.equal(raw.code, 'layer 2 node had wrong codec')
    expect(child2.Links[1].Hash.code).to.equal(raw.code, 'layer 2 node had wrong codec')

    // export file
    const file = await exporter(imported.cid, block)

    // export file data with default settings
    const blockReadSpy = Sinon.spy(block, 'get')
    const contentWithDefaultBlockConcurrency = await toBuffer(file.content())

    // blocks should be loaded in default order - a whole level of sibling nodes at a time
    expect(blockReadSpy.getCalls().map(call => call.args[0].toString())).to.deep.equal([
      node.Links[0].Hash.toString(),
      node.Links[1].Hash.toString(),
      child1.Links[0].Hash.toString(),
      child1.Links[1].Hash.toString(),
      child2.Links[0].Hash.toString(),
      child2.Links[1].Hash.toString()
    ])

    // export file data overriding read concurrency
    blockReadSpy.resetHistory()
    const contentWitSmallBlockConcurrency = await toBuffer(file.content({
      blockReadConcurrency: 1
    }))

    // blocks should be loaded in traversal order
    expect(blockReadSpy.getCalls().map(call => call.args[0].toString())).to.deep.equal([
      node.Links[0].Hash.toString(),
      child1.Links[0].Hash.toString(),
      child1.Links[1].Hash.toString(),
      node.Links[1].Hash.toString(),
      child2.Links[0].Hash.toString(),
      child2.Links[1].Hash.toString()
    ])

    // ensure exported bytes are the same
    expect(contentWithDefaultBlockConcurrency).to.equalBytes(contentWitSmallBlockConcurrency)
  })
})
