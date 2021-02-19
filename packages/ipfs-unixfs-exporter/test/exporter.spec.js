/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')
// @ts-ignore
const IPLD = require('ipld')
// @ts-ignore
const inMemory = require('ipld-in-memory')
const UnixFS = require('ipfs-unixfs')
const CID = require('cids')
const {
  DAGNode,
  DAGLink
} = require('ipld-dag-pb')
const mh = require('multihashing-async').multihash
const mc = require('multicodec')
const exporter = require('../src')
const importer = require('ipfs-unixfs-importer')
const all = require('it-all')
const last = require('it-last')
const first = require('it-first')
const randomBytes = require('it-buffer-stream')
const { AbortController } = require('native-abort-controller')
const blockApi = require('./helpers/block')
const uint8ArrayFromString = require('uint8arrays/from-string')
const uint8ArrayToString = require('uint8arrays/to-string')
const uint8ArrayConcat = require('uint8arrays/concat')

const ONE_MEG = Math.pow(1024, 2)

describe('exporter', () => {
  /** @type {import('ipfs-core-types/src/ipld').IPLD} */
  let ipld
  /** @type {import('ipfs-unixfs-importer').BlockAPI} */
  let block
  /** @type {Uint8Array} */
  let bigFile
  /** @type {Uint8Array} */
  let smallFile

  before(async () => {
    bigFile = uint8ArrayConcat(await all(randomBytes(ONE_MEG * 1.2)))
    smallFile = uint8ArrayConcat(await all(randomBytes(200)))
  })

  /**
   * @param {object} [options]
   * @param {string} [options.type='file']
   * @param {Uint8Array} [options.content]
   * @param {DAGLink[]} [options.links=[]]
   */
  async function dagPut (options = {}) {
    options.type = options.type || 'file'
    options.content = options.content || Uint8Array.from([0x01, 0x02, 0x03])
    options.links = options.links || []

    const file = new UnixFS({
      type: options.type,
      data: options.content
    })

    const node = new DAGNode(file.marshal(), options.links)
    const cid = await ipld.put(node, mc.DAG_PB, {
      cidVersion: 0,
      hashAlg: mh.names['sha2-256']
    })

    return { file: file, node: node, cid: cid }
  }

  /**
   * @param {object} options
   * @param {Uint8Array} options.file
   * @param {'balanced' | 'flat' | 'trickle'} [options.strategy='balanced']
   * @param {string} [options.path='/foo']
   * @param {number} [options.maxChunkSize]
   * @param {boolean} [options.rawLeaves]
   */
  async function addTestFile ({ file, strategy = 'balanced', path = '/foo', maxChunkSize, rawLeaves }) {
    const result = await all(importer([{
      path,
      content: file
    }], block, {
      strategy,
      rawLeaves,
      maxChunkSize
    }))

    return result[0].cid
  }

  /**
   * @param {object} options
   * @param {Uint8Array} options.file
   * @param {number} [options.offset]
   * @param {number} [options.length]
   * @param {'balanced' | 'flat' | 'trickle'} [options.strategy='balanced']
   * @param {string} [options.path='/foo']
   * @param {number} [options.maxChunkSize]
   * @param {boolean} [options.rawLeaves]
   */
  async function addAndReadTestFile ({ file, offset, length, strategy = 'balanced', path = '/foo', maxChunkSize, rawLeaves }) {
    const cid = await addTestFile({ file, strategy, path, maxChunkSize, rawLeaves })
    const entry = await exporter(cid, ipld)

    if (entry.type !== 'file' && entry.type !== 'raw') {
      throw new Error('Unexpected type')
    }

    return uint8ArrayConcat(await all(entry.content({
      offset, length
    })))
  }

  /**
   * @param {'balanced' | 'flat' | 'trickle'} strategy
   */
  async function checkBytesThatSpanBlocks (strategy) {
    const bytesInABlock = 262144
    const bytes = new Uint8Array(bytesInABlock + 100)

    bytes[bytesInABlock - 1] = 1
    bytes[bytesInABlock] = 2
    bytes[bytesInABlock + 1] = 3

    const data = await addAndReadTestFile({
      file: bytes,
      offset: bytesInABlock - 1,
      length: 3,
      strategy
    })

    expect(data).to.deep.equal(Uint8Array.from([1, 2, 3]))
  }

  /**
   * @param {import('ipfs-core-types/src/ipld').IPLD} ipld
   * @param {'file' | 'directory' | 'raw'} type
   * @param {Uint8Array | ArrayLike<number> | undefined} data
   * @param {{ node: DAGNode, cid: CID }[]} children
   */
  async function createAndPersistNode (ipld, type, data, children) {
    const file = new UnixFS({ type, data: data ? Uint8Array.from(data) : undefined })
    const links = []

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      const leaf = UnixFS.unmarshal(child.node.Data)

      file.addBlockSize(leaf.fileSize())

      links.push(new DAGLink('', child.node.size, child.cid))
    }

    const node = new DAGNode(file.marshal(), links)
    const cid = await ipld.put(node, mc.DAG_PB, {
      cidVersion: 1,
      hashAlg: mh.names['sha2-256']
    })

    return {
      node,
      cid
    }
  }

  before(async () => {
    ipld = await inMemory(IPLD)
    block = blockApi(ipld)
  })

  it('ensure hash inputs are sanitized', async () => {
    const result = await dagPut()
    const node = await ipld.get(result.cid)
    const unmarsh = UnixFS.unmarshal(node.Data)

    expect(unmarsh.data).to.deep.equal(result.file.data)

    const file = await exporter(result.cid, ipld)

    expect(file).to.have.property('cid')
    expect(file).to.have.property('path', result.cid.toBaseEncodedString())

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
      content: smallFile
    }], block))

    const path = `/ipfs/${files[1].cid.toBaseEncodedString()}/${fileName}`
    const file = await exporter(path, ipld)

    expect(file.name).to.equal(fileName)
    expect(file.path).to.equal(`${files[1].cid.toBaseEncodedString()}/${fileName}`)
  })

  it('small file in a directory with an square brackets in the title', async () => {
    const fileName = `small-[bar]-file-${Math.random()}.txt`
    const filePath = `/foo/${fileName}`

    const files = await all(importer([{
      path: filePath,
      content: smallFile
    }], block))

    const path = `/ipfs/${files[1].cid.toBaseEncodedString()}/${fileName}`
    const file = await exporter(path, ipld)

    expect(file.name).to.equal(fileName)
    expect(file.path).to.equal(`${files[1].cid.toBaseEncodedString()}/${fileName}`)
  })

  it('exports a chunk of a file with no links', async () => {
    const offset = 0
    const length = 5

    const result = await dagPut({
      content: uint8ArrayConcat(await all(randomBytes(100)))
    })

    const node = await ipld.get(result.cid)
    const unmarsh = UnixFS.unmarshal(node.Data)

    if (!unmarsh.data) {
      throw new Error('Unexpected data')
    }

    const file = await exporter(result.cid, ipld)

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
    const chunkNode1 = new DAGNode(chunk1.marshal())
    const chunkCid1 = await ipld.put(chunkNode1, mc.DAG_PB, {
      cidVersion: 0,
      hashAlg: mh.names['sha2-256']
    })

    const chunk2 = new UnixFS({ type: 'raw', data: content.slice(5) })
    const chunkNode2 = new DAGNode(chunk2.marshal())
    const chunkCid2 = await ipld.put(chunkNode2, mc.DAG_PB, {
      cidVersion: 0,
      hashAlg: mh.names['sha2-256']
    })

    const file = new UnixFS({
      type: 'file'
    })
    file.addBlockSize(5)
    file.addBlockSize(5)

    const fileNode = new DAGNode(file.marshal(), [
      new DAGLink('', chunkNode1.size, chunkCid1),
      new DAGLink('', chunkNode2.size, chunkCid2)
    ])
    const fileCid = await ipld.put(fileNode, mc.DAG_PB, {
      cidVersion: 0,
      hashAlg: mh.names['sha2-256']
    })

    const exported = await exporter(fileCid, ipld)

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
      links: [
        new DAGLink('', chunk.node.size, chunk.cid)
      ]
    })

    if (!result.file.data) {
      throw new Error('Expected data')
    }

    const file = await exporter(result.cid, ipld)

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(file.content({
      offset,
      length
    })))

    expect(data).to.deep.equal(result.file.data.slice(offset, offset + length))
  })

  it('exports a large file > 5mb', async function () {
    this.timeout(30 * 1000)

    const cid = await addTestFile({
      file: uint8ArrayConcat(await all(randomBytes(ONE_MEG * 6)))
    })

    const file = await exporter(cid, ipld)

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    expect(file).to.have.property('path', cid.toBaseEncodedString())
    expect(file.unixfs.fileSize()).to.equal(ONE_MEG * 6)
  })

  it('exports a chunk of a large file > 5mb', async function () {
    this.timeout(30 * 1000)

    const offset = 0
    const length = 5
    const bytes = uint8ArrayConcat(await all(randomBytes(ONE_MEG * 6)))

    const cid = await addTestFile({
      file: bytes
    })

    const file = await exporter(cid, ipld)
    expect(file).to.have.property('path', cid.toBaseEncodedString())

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

    if (!importedDir) {
      throw new Error('Nothing imported')
    }

    const dir = await exporter(importedDir.cid, ipld)

    if (dir.type !== 'directory') {
      throw new Error('Unexpected type')
    }

    const files = await all(dir.content())

    files.forEach(file => expect(file).to.have.property('cid'))

    expect(
      files.map((file) => file.path)
    ).to.be.eql([
      `${dir.cid.toBaseEncodedString()}/200Bytes.txt`,
      `${dir.cid.toBaseEncodedString()}/dir-another`,
      `${dir.cid.toBaseEncodedString()}/level-1`
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

    if (!importedDir) {
      throw new Error('Nothing imported')
    }

    const dir = await exporter(importedDir.cid, ipld)

    if (dir.type !== 'directory') {
      throw new Error('Unexpected type')
    }

    const files = await all(dir.content())

    files.forEach(file => expect(file).to.have.property('cid'))

    expect(
      files.map((file) => file.path)
    ).to.be.eql([
      `${importedDir.cid.toBaseEncodedString()}/200Bytes.txt`,
      `${importedDir.cid.toBaseEncodedString()}/dir-another`,
      `${importedDir.cid.toBaseEncodedString()}/level-1`
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      expect(err.message).to.equal('Offset must be less than the file size')
      expect(err.code).to.equal('ERR_INVALID_PARAMS')
    }
  })

  it('exports a large file > 1mb imported with raw leaves', async () => {
    const imported = await first(importer([{
      path: '1.2MiB.txt',
      content: bigFile
    }], block, {
      rawLeaves: true
    }))

    if (!imported) {
      throw new Error('Nothing imported')
    }

    const file = await exporter(imported.cid, ipld)

    if (file.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(file.content()))

    expect(data).to.deep.equal(bigFile)
  })

  it('returns an empty stream for dir', async () => {
    const imported = await first(importer([{
      path: 'empty'
    }], block))

    if (!imported) {
      throw new Error('Nothing imported')
    }

    const dir = await exporter(imported.cid, ipld)

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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
      maxChunkSize: 1024
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
      maxChunkSize: 1024
    })
    const file = await exporter(cid, ipld)

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
    await checkBytesThatSpanBlocks('balanced')
  })

  it('reads bytes with an offset and a length that span blocks using flat layout', async () => {
    await checkBytesThatSpanBlocks('flat')
  })

  it('reads bytes with an offset and a length that span blocks using trickle layout', async () => {
    await checkBytesThatSpanBlocks('trickle')
  })

  it('fails on non existent hash', async () => {
    // This hash doesn't exist in the repo
    const hash = 'bafybeidu2qqwriogfndznz32swi5r4p2wruf6ztu5k7my53tsezwhncs5y'

    try {
      await exporter(hash, ipld)
    } catch (err) {
      expect(err.code).to.equal('ERR_NOT_FOUND')
    }
  })

  it('exports file with data on internal and leaf nodes', async () => {
    const leaf = await createAndPersistNode(ipld, 'raw', [0x04, 0x05, 0x06, 0x07], [])
    const node = await createAndPersistNode(ipld, 'file', [0x00, 0x01, 0x02, 0x03], [
      leaf
    ])

    const file = await exporter(node.cid, ipld)

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
      createAndPersistNode(ipld, 'raw', [0x00, 0x01, 0x02, 0x03], []),
      createAndPersistNode(ipld, 'raw', [0x08, 0x09, 0x10, 0x11], []),
      createAndPersistNode(ipld, 'raw', [0x12, 0x13, 0x14, 0x15], [])
    ])

    const internalNodes = await Promise.all([
      createAndPersistNode(ipld, 'raw', [0x04, 0x05, 0x06, 0x07], [leaves[1]]),
      createAndPersistNode(ipld, 'raw', undefined, [leaves[2]])
    ])

    const node = await createAndPersistNode(ipld, 'file', undefined, [
      leaves[0],
      internalNodes[0],
      internalNodes[1]
    ])

    const file = await exporter(node.cid, ipld)

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

  it('exports file with data on internal and leaf nodes with an offset that only fetches data from leaf nodes', async () => {
    const leaf = await createAndPersistNode(ipld, 'raw', [0x04, 0x05, 0x06, 0x07], [])
    const node = await createAndPersistNode(ipld, 'file', [0x00, 0x01, 0x02, 0x03], [
      leaf
    ])

    const file = await exporter(node.cid, ipld)

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
      content: bigFile
    }], block, {
      rawLeaves: true
    }))

    if (!imported) {
      throw new Error('Nothing imported')
    }

    const file = await exporter(imported.cid, ipld)

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
      content: smallFile
    }], block, {
      rawLeaves: true
    }))

    if (!imported) {
      throw new Error('Nothing imported')
    }

    const file = await exporter(imported.cid, ipld)
    expect(CID.isCID(file.cid)).to.be.true()

    if (file.type !== 'raw') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(file.content()))
    expect(data).to.deep.equal(smallFile)
  })

  it('errors when exporting a non-existent key from a cbor node', async () => {
    const cborNodeCid = await ipld.put({
      foo: 'bar'
    }, mc.DAG_CBOR)

    try {
      await exporter(`${cborNodeCid.toBaseEncodedString()}/baz`, ipld)
    } catch (err) {
      expect(err.code).to.equal('ERR_NO_PROP')
    }
  })

  it('exports a cbor node', async () => {
    const node = {
      foo: 'bar'
    }

    const cborNodeCid = await ipld.put(node, mc.DAG_CBOR)
    const exported = await exporter(`${cborNodeCid.toBaseEncodedString()}`, ipld)

    if (exported.type !== 'object') {
      throw new Error('Unexpected type')
    }

    expect(exported.node).to.deep.equal(node)
  })

  it('errors when exporting a node with no resolver', async () => {
    const cid = new CID(1, 'git-raw', new CID('zdj7WkRPAX9o9nb9zPbXzwG7JEs78uyhwbUs8JSUayB98DWWY').multihash)

    try {
      await exporter(`${cid.toBaseEncodedString()}`, ipld)
    } catch (err) {
      expect(err.code).to.equal('ERR_NO_RESOLVER')
    }
  })

  it('errors if we try to export links from inside a raw node', async () => {
    const cid = await ipld.put(Uint8Array.from([0, 1, 2, 3, 4]), mc.RAW)

    try {
      await exporter(`${cid.toBaseEncodedString()}/lol`, ipld)
    } catch (err) {
      expect(err.code).to.equal('ERR_NOT_FOUND')
    }
  })

  it('errors we export a non-unixfs dag-pb node', async () => {
    const cid = await ipld.put(new DAGNode(Uint8Array.from([0, 1, 2, 3, 4])), mc.DAG_PB)

    try {
      await exporter(cid, ipld)
    } catch (err) {
      expect(err.code).to.equal('ERR_NOT_UNIXFS')
    }
  })

  it('errors we export a unixfs node that has a non-unixfs/dag-pb child', async () => {
    const cborNodeCid = await ipld.put({
      foo: 'bar'
    }, mc.DAG_CBOR)

    const file = new UnixFS({
      type: 'file'
    })
    file.addBlockSize(100)

    const cid = await ipld.put(new DAGNode(file.marshal(), [
      new DAGLink('', 100, cborNodeCid)
    ]), mc.DAG_PB)

    const exported = await exporter(cid, ipld)

    if (exported.type !== 'file') {
      throw new Error('Unexpected type')
    }

    try {
      await all(exported.content())
    } catch (err) {
      expect(err.code).to.equal('ERR_NOT_UNIXFS')
    }
  })

  it('exports a node with depth', async () => {
    const imported = await all(importer([{
      path: '/foo/bar/baz.txt',
      content: uint8ArrayFromString('hello world')
    }], block))

    const exported = await exporter(imported[0].cid, ipld)

    expect(exported.depth).to.equal(0)
  })

  it('exports a node recursively with depth', async () => {
    const dir = await last(importer([{
      path: '/foo/bar/baz.txt',
      content: uint8ArrayFromString('hello world')
    }, {
      path: '/foo/qux.txt',
      content: uint8ArrayFromString('hello world')
    }, {
      path: '/foo/bar/quux.txt',
      content: uint8ArrayFromString('hello world')
    }], block))

    if (!dir) {
      throw new Error('Nothing imported')
    }

    const exported = await all(exporter.recursive(dir.cid, ipld))
    const dirCid = dir.cid.toBaseEncodedString()

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
    const hash = mh.encode(data, 'identity')
    const cid = new CID(1, 'identity', hash)

    const exported = await exporter(cid, ipld)

    if (exported.type !== 'identity') {
      throw new Error('Unexpected type')
    }

    const result = uint8ArrayConcat(await all(exported.content()))

    expect(result).to.deep.equal(data)
    expect(uint8ArrayToString(result)).to.equal('hello world')
  })

  it('exports a CID encoded with the identity hash with an offset', async () => {
    const data = uint8ArrayFromString('hello world')
    const hash = mh.encode(data, 'identity')
    const cid = new CID(1, 'identity', hash)

    const exported = await exporter(cid, ipld)

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
    const hash = mh.encode(data, 'identity')
    const cid = new CID(1, 'identity', hash)

    const exported = await exporter(cid, ipld)

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
    const hash = mh.encode(data, 'identity')
    const cid = new CID(1, 'identity', hash)

    const exported = await exporter(cid, ipld)

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
    const hash = mh.encode(data, 'sha2-256')
    const cid = new CID(1, 'dag-pb', hash)
    const message = `User aborted ${Math.random()}`

    setTimeout(() => {
      abortController.abort()
    }, 100)

    // regular test IPLD is offline-only, we need to mimic what happens when
    // we try to get a block from the network
    const ipld = {
      /**
       *
       * @param {CID} cid
       * @param {{ signal: AbortSignal }} options
       */
      get: (cid, options) => {
        // promise will never resolve, so reject it when the abort signal is sent
        return new Promise((resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            reject(new Error(message))
          })
        })
      }
    }

    // @ts-ignore ipld implementation incomplete
    await expect(exporter(cid, ipld, {
      signal: abortController.signal
    })).to.eventually.be.rejectedWith(message)
  })
})
