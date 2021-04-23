/* eslint-env mocha */
'use strict'

const { importer } = require('ipfs-unixfs-importer')
const { exporter, recursive } = require('../src')
const extend = require('merge-options')
const { expect } = require('aegir/utils/chai')
const sinon = require('sinon')
const { UnixFS } = require('ipfs-unixfs')
const collectLeafCids = require('./helpers/collect-leaf-cids')
// @ts-ignore
const loadFixture = require('aegir/utils/fixtures')
// @ts-ignore
const isNode = require('detect-node')
/** @type {Uint8Array} */
const bigFile = loadFixture((isNode ? __dirname : 'test') + '/fixtures/1.2MiB.txt')
/** @type {Uint8Array} */
const smallFile = loadFixture((isNode ? __dirname : 'test') + '/fixtures/200Bytes.txt')
const all = require('it-all')
const first = require('it-first')
const blockApi = require('./helpers/block')
const uint8ArrayConcat = require('uint8arrays/concat')
const uint8ArrayFromString = require('uint8arrays/from-string')
const asAsyncIterable = require('./helpers/as-async-iterable')
const last = require('it-last')
const { CID } = require('multiformats/cid')
const { base58btc } = require('multiformats/bases/base58')
const { decode } = require('@ipld/dag-pb')
const { parseMtime } = require('ipfs-unixfs')

/**
 * @typedef {import('ipfs-unixfs-importer/src/types').BlockAPI} BlockAPI
 * @typedef {import('@ipld/dag-pb').PBNode} PBNode
 */

/**
 * @param {{ path?: string, cid: CID, unixfs?: UnixFS }[]} files
 */
function stringifyMh (files) {
  return files.map((file) => {
    return {
      ...file,
      cid: file.cid.toString()
    }
  })
}

/**
 * @param {Date} date
 */
function dateToTimespec (date) {
  const ms = date.getTime()
  const secs = Math.floor(ms / 1000)

  return {
    secs,
    nsecs: (ms - (secs * 1000)) * 1000
  }
}

const baseFiles = {
  '200Bytes.txt': {
    cid: 'QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8',
    size: 200,
    type: 'file',
    path: '200Bytes.txt'
  },
  '1.2MiB.txt': {
    cid: 'QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q',
    size: 1258000,
    type: 'file',
    path: '1.2MiB.txt'
  },
  'small.txt': {
    cid: 'QmZMb7HWpbevpcdhbUV1ZZgdji8vh5uQ13KxczChGrK9Rd',
    size: 15,
    type: 'file',
    path: 'small.txt'
  }
}

const strategyBaseFiles = {
  flat: baseFiles,
  balanced: extend({}, baseFiles, {
    '1.2MiB.txt': {
      cid: 'QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q',
      type: 'file'
    }
  }),
  trickle: extend({}, baseFiles, {
    '200Bytes.txt': {
      cid: 'QmY8bwnoKAKvJ8qtyPhWNxSS6sxiGVTJ9VpdQffs2KB5pE',
      size: 200,
      type: 'file',
      path: '200Bytes.txt'
    },
    '1.2MiB.txt': {
      cid: 'QmfAxsHrpaLLuhbqqbo9KQyvQNawMnVSwutYoJed75pnco',
      type: 'file'
    }
  })
}

const strategies = [
  'flat',
  'balanced',
  'trickle'
]

const strategyOverrides = {
  balanced: {
    'foo-big': {
      cid: 'QmaFgyFJUP4fxFySJCddg2Pj6rpwSywopWk87VEVv52RSj',
      path: 'foo-big',
      size: 1335478,
      type: 'directory'
    },
    pim: {
      cid: 'QmY8a78tx6Tk6naDgWCgTsd9EqGrUJRrH7dDyQhjyrmH2i',
      path: 'pim',
      size: 1335744,
      type: 'directory'
    },
    'pam/pum': {
      cid: 'QmY8a78tx6Tk6naDgWCgTsd9EqGrUJRrH7dDyQhjyrmH2i',
      path: 'pam/pum',
      size: 1335744,
      type: 'directory'
    },
    pam: {
      cid: 'QmRgdtzNx1H1BPJqShdhvWZ2D4DA2HUgZJ3XLtoXei27Av',
      path: 'pam',
      size: 2671269,
      type: 'directory'
    }
  },
  trickle: {
    'foo-big': {
      cid: 'QmaKbhFRy9kcCbcwrLsqYHWMiY44BDYkqTCMpAxDdd2du2',
      path: 'foo-big',
      size: 1334657,
      type: 'directory'
    },
    pim: {
      cid: 'QmbWGdnua4YuYpWJb7fE25PRbW9GbKKLqq9Ucmnsg2gxnt',
      path: 'pim',
      size: 1334923,
      type: 'directory'
    },
    'pam/pum': {
      cid: 'QmbWGdnua4YuYpWJb7fE25PRbW9GbKKLqq9Ucmnsg2gxnt',
      path: 'pam/pum',
      size: 1334923,
      type: 'directory'
    },
    pam: {
      cid: 'QmSuh47G9Qm3PFv1zziojtHxqCjuurSdtWAzxLxoKJPq2U',
      path: 'pam',
      size: 2669627,
      type: 'directory'
    },
    '200Bytes.txt with raw leaves': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmagyRwMfYhczYNv5SvcJc8xxXjZQBTTHS2jEqNMva2mYT',
      size: 200
    }),
    '200Bytes.txt with raw leaves and mode': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmRYYSoRkL9bh5gzbgHndWjt81TYnM4W7MjzTp8WWioLGB',
      size: 200
    }),
    '200Bytes.txt with raw leaves and mtime': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmQ1QHqXqgxJ4qjJZouRdYG7pdS6yzdhSAq7dYAu9bN6h4',
      size: 200
    }),
    '200Bytes.txt with raw leaves and metadata': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmWUpftnvHN1Ey5iGoaWwMUZPnViXeJctDSUkcvunkahFo',
      size: 200
    }),
    'foo/bar': {
      cid: 'QmTGMxKPzSGNBDp6jhTwnZxGW6w1S9ciyycRJ4b2qcQaHK',
      size: 0,
      path: 'foo/bar',
      type: 'directory'
    },
    foo: {
      cid: 'Qme4A8fZmwfZESappfPcxSMTZVACiEzhHKtYRMuM1hbkDp',
      size: 0,
      path: 'foo',
      type: 'directory'
    },
    'small.txt': {
      cid: 'QmXmZ3qT328JxWtQXqrmvma2FmPp7tMdNiSuYvVJ5QRhKs',
      size: 15,
      type: 'file',
      path: 'small.txt'
    }
  }
}

/**
 * @param {BlockAPI} block
 * @param {import('ipfs-unixfs-importer').UserImporterOptions} options
 * @param {*} expected
 */
const checkLeafNodeTypes = async (block, options, expected) => {
  const file = await first(importer([{
    path: 'foo',
    content: asAsyncIterable(new Uint8Array(262144 + 5).fill(1))
  }], block, options))

  if (!file) {
    throw new Error('Nothing imported')
  }

  // @type {Block}
  const fileBlock = await block.get(file.cid)
  /** @type {PBNode} */
  const node = decode(fileBlock.bytes)
  if (!node.Data) {
    throw new Error('PBNode Data undefined')
  }
  const meta = UnixFS.unmarshal(node.Data)

  expect(meta.type).to.equal('file')
  expect(node.Links.length).to.equal(2)

  const linkedBlocks = await Promise.all(
    node.Links.map(link => block.get(link.Hash))
  )

  linkedBlocks.forEach(({ bytes }) => {
    const node = decode(bytes)
    if (!node.Data) {
      throw new Error('PBNode Data undefined')
    }
    const meta = UnixFS.unmarshal(node.Data)
    expect(meta.type).to.equal(expected)
  })
}

/**
 * @param {BlockAPI} block
 * @param {import('ipfs-unixfs-importer').UserImporterOptions} options
 * @param {*} expected
 */
const checkNodeLinks = async (block, options, expected) => {
  for await (const file of importer([{
    path: 'foo',
    content: asAsyncIterable(new Uint8Array(100).fill(1))
  }], block, options)) {
    const fileBlock = await block.get(file.cid)
    const node = decode(fileBlock.bytes)
    if (!node.Data) {
      throw new Error('PBNode Data undefined')
    }
    const meta = UnixFS.unmarshal(node.Data)

    expect(meta.type).to.equal('file')
    expect(node.Links.length).to.equal(expected)
  }
}

strategies.forEach((strategy) => {
  // @ts-ignore
  const baseFiles = strategyBaseFiles[strategy]
  const defaultResults = extend({}, baseFiles, {
    'foo/bar/200Bytes.txt': extend({}, baseFiles['200Bytes.txt'], {
      path: 'foo/bar/200Bytes.txt'
    }),
    foo: {
      path: 'foo',
      cid: 'QmQrb6KKWGo8w7zKfx2JksptY6wN7B2ysSBdKZr4xMU36d',
      size: 320,
      type: 'directory'
    },
    'foo/bar': {
      path: 'foo/bar',
      cid: 'Qmf5BQbTUyUAvd6Ewct83GYGnE1F6btiC3acLhR8MDxgkD',
      size: 270,
      type: 'directory'
    },
    'foo-big/1.2MiB.txt': extend({}, baseFiles['1.2MiB.txt'], {
      path: 'foo-big/1.2MiB.txt'
    }),
    'foo-big': {
      path: 'foo-big',
      cid: 'QmaFgyFJUP4fxFySJCddg2Pj6rpwSywopWk87VEVv52RSj',
      size: 1328120,
      type: 'directory'
    },
    'pim/200Bytes.txt': extend({}, baseFiles['200Bytes.txt'], {
      path: 'pim/200Bytes.txt'
    }),
    'pim/1.2MiB.txt': extend({}, baseFiles['1.2MiB.txt'], {
      path: 'pim/1.2MiB.txt'
    }),
    pim: {
      path: 'pim',
      cid: 'QmY8a78tx6Tk6naDgWCgTsd9EqGrUJRrH7dDyQhjyrmH2i',
      size: 1328386,
      type: 'directory'
    },
    'empty-dir': {
      path: 'empty-dir',
      cid: 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn',
      size: 4,
      type: 'directory'
    },
    'pam/pum': {
      cid: 'QmY8a78tx6Tk6naDgWCgTsd9EqGrUJRrH7dDyQhjyrmH2i',
      path: 'pam/pum',
      size: 1328386,
      type: 'directory'
    },
    pam: {
      cid: 'QmRgdtzNx1H1BPJqShdhvWZ2D4DA2HUgZJ3XLtoXei27Av',
      path: 'pam',
      size: 2656553,
      type: 'directory'
    },
    '200Bytes.txt with raw leaves': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'zb2rhXrz1gkCv8p4nUDZRohY6MzBE9C3HVTVDP72g6Du3SD9Q'
    }),
    '200Bytes.txt with raw leaves and mode': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmWXbKV9BKJqd8x1NUw1myH987bURrn9Rna3rszYJgQwtX',
      size: 200
    }),
    '200Bytes.txt with raw leaves and mtime': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmYfLToWgeJwrFFKideGNaS1zkmrow1a9o862sUL43NapC',
      size: 200
    }),
    '200Bytes.txt with raw leaves and metadata': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmVfHowk2oKuWFyVwSRt8H1dQ3v272jyWSwhfQnTtWNmfw',
      size: 200
    })
  // @ts-ignore
  }, strategyOverrides[strategy])

  const expected = extend({}, defaultResults)

  /**
   * @param {*} actualFiles
   * @param {*} expectedFiles
   */
  const expectFiles = (actualFiles, expectedFiles) => {
    expect(actualFiles.length).to.equal(expectedFiles.length)

    for (let i = 0; i < expectedFiles.length; i++) {
      const expectedFile = expected[expectedFiles[i]]
      const actualFile = actualFiles[i]

      expect(actualFile.path).to.equal(expectedFile.path)
      expect(actualFile.cid.toString(base58btc)).to.equal(expectedFile.cid.toString())

      if (actualFile.unixfs) {
        expect(actualFile.unixfs.type).to.equal(expectedFile.type)

        if (actualFile.unixfs.type === 'file') {
          expect(actualFile.unixfs.fileSize()).to.equal(expectedFile.size)
        }
      }
    }
  }

  describe('importer: ' + strategy, function () {
    this.timeout(30 * 1000)

    /** @type {BlockAPI} */
    const block = blockApi()
    /** @type {import('ipfs-unixfs-importer').UserImporterOptions} */
    const options = {
      // @ts-ignore
      strategy: strategy
    }

    if (strategy === 'trickle') {
      // replicate go-ipfs behaviour
      options.leafType = 'raw'
      options.reduceSingleLeafToSelf = false
    }

    it('fails on bad content', async () => {
      try {
        // @ts-expect-error bad content
        await all(importer([{
          path: '200Bytes.txt',
          content: 7
        }], block, options))
        throw new Error('No error was thrown')
      } catch (err) {
        expect(err.code).to.equal('ERR_INVALID_CONTENT')
      }
    })

    it('fails on an iterator that yields bad content', async () => {
      try {
        await all(importer([{
          path: '200Bytes.txt',
          content: {
            // @ts-expect-error bad content
            [Symbol.iterator]: function * () {
              yield 7
            }
          }
        }], block, options))
        throw new Error('No error was thrown')
      } catch (err) {
        expect(err.code).to.equal('ERR_INVALID_CONTENT')
      }
    })

    it('doesn\'t yield anything on empty source', async () => {
      const files = await all(importer([], block, options))

      expect(files).to.be.empty()
    })

    it('doesn\'t yield anything on empty file', async () => {
      const files = await all(importer([{
        path: 'emptyfile',
        content: asAsyncIterable(new Uint8Array(0))
      }], block, options))

      expect(files.length).to.eql(1)

      // always yield empty file node
      expect(files[0].cid.toString()).to.eql('QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH')
    })

    it('supports more than one root', async () => {
      const files = await all(importer([{
        path: '200Bytes.txt',
        content: asAsyncIterable(smallFile)
      }, {
        path: '200Bytes.txt',
        content: asAsyncIterable(bigFile)
      }], block, options))

      expect(files).to.have.lengthOf(2)
    })

    it('small file with an escaped slash in the title', async () => {
      const filePath = `small-\\/file-${Math.random()}.txt`
      const files = await all(importer([{
        path: filePath,
        content: asAsyncIterable(smallFile)
      }], block, options))

      expect(files.length).to.equal(1)
      expect(files[0].path).to.equal(filePath)
    })

    it('small file with square brackets in the title', async () => {
      const filePath = `small-[v]-file-${Math.random()}.txt`
      const files = await all(importer([{
        path: filePath,
        content: asAsyncIterable(smallFile)
      }], block, options))

      expect(files.length).to.equal(1)
      expect(files[0].path).to.equal(filePath)
    })

    it('small file as buffer (smaller than a chunk)', async () => {
      const files = await all(importer([{
        path: '200Bytes.txt',
        content: asAsyncIterable(smallFile)
      }], block, options))

      expectFiles(files, [
        '200Bytes.txt'
      ])
    })

    it('small file as array (smaller than a chunk)', async () => {
      const files = await all(importer([{
        path: '200Bytes.txt',
        content: asAsyncIterable(Uint8Array.from(smallFile))
      }], block, options))

      expectFiles(files, [
        '200Bytes.txt'
      ])
    })

    it('small file (smaller than a chunk) with raw leaves', async () => {
      const files = await all(importer([{
        path: '200Bytes.txt',
        content: asAsyncIterable(smallFile)
      }], block, {
        ...options,
        rawLeaves: true
      }))

      expectFiles(files, [
        '200Bytes.txt with raw leaves'
      ])
    })

    it('small file (smaller than a chunk) with raw leaves and mode', async () => {
      const files = await all(importer([{
        path: '200Bytes.txt',
        content: asAsyncIterable(smallFile),
        mode: 0o123
      }], block, {
        ...options,
        rawLeaves: true
      }))

      expectFiles(files, [
        '200Bytes.txt with raw leaves and mode'
      ])
    })

    it('small file (smaller than a chunk) with raw leaves and mtime', async () => {
      const files = await all(importer([{
        path: '200Bytes.txt',
        content: asAsyncIterable(smallFile),
        mtime: {
          secs: 10,
          nsecs: 0
        }
      }], block, {
        ...options,
        rawLeaves: true
      }))

      expectFiles(files, [
        '200Bytes.txt with raw leaves and mtime'
      ])
    })

    it('small file (smaller than a chunk) with raw leaves and metadata', async () => {
      const files = await all(importer([{
        path: '200Bytes.txt',
        content: asAsyncIterable(smallFile),
        mode: 0o123,
        mtime: {
          secs: 10,
          nsecs: 0
        }
      }], block, {
        ...options,
        rawLeaves: true
      }))

      expectFiles(files, [
        '200Bytes.txt with raw leaves and metadata'
      ])
    })

    it('small file (smaller than a chunk) inside a dir', async () => {
      const files = await all(importer([{
        path: 'foo/bar/200Bytes.txt',
        content: asAsyncIterable(smallFile)
      }], block, options))

      expectFiles(files, [
        'foo/bar/200Bytes.txt',
        'foo/bar',
        'foo'
      ])
    })

    it('file bigger than a single chunk', async () => {
      this.timeout(60 * 1000)

      const files = await all(importer([{
        path: '1.2MiB.txt',
        content: asAsyncIterable(bigFile)
      }], block, options))

      expectFiles(files, [
        '1.2MiB.txt'
      ])
    })

    it('file bigger than a single chunk inside a dir', async () => {
      this.timeout(60 * 1000)

      const files = await all(importer([{
        path: 'foo-big/1.2MiB.txt',
        content: asAsyncIterable(bigFile)
      }], block, options))

      expectFiles(files, [
        'foo-big/1.2MiB.txt',
        'foo-big'
      ])
    })

    it('empty directory', async () => {
      const files = await all(importer([{
        path: 'empty-dir'
      }], block, options))

      expectFiles(files, [
        'empty-dir'
      ])
    })

    it('directory with files', async () => {
      const files = await all(importer([{
        path: 'pim/200Bytes.txt',
        content: asAsyncIterable(smallFile)
      }, {
        path: 'pim/1.2MiB.txt',
        content: asAsyncIterable(bigFile)
      }], block, options))

      expectFiles(files, [
        'pim/200Bytes.txt',
        'pim/1.2MiB.txt',
        'pim'
      ])
    })

    it('nested directory (2 levels deep)', async () => {
      const files = await all(importer([{
        path: 'pam/pum/200Bytes.txt',
        content: asAsyncIterable(smallFile)
      }, {
        path: 'pam/pum/1.2MiB.txt',
        content: asAsyncIterable(bigFile)
      }, {
        path: 'pam/1.2MiB.txt',
        content: asAsyncIterable(bigFile)
      }], block, options))

      const result = stringifyMh(files)

      expect(result.length).to.equal(5)

      result.forEach(eachFile)

      /**
       * @param {{ path?: string, cid: string, unixfs?: UnixFS }} file
       */
      function eachFile (file) {
        if (!file.unixfs) {
          throw new Error('file was not UnixFS')
        }

        if (file.path === 'pam/pum/200Bytes.txt') {
          expect(file.cid).to.equal(expected['200Bytes.txt'].cid)
          expect(file.unixfs.fileSize()).to.equal(expected['200Bytes.txt'].size)
        } else if (file.path === 'pam/pum/1.2MiB.txt') {
          expect(file.cid).to.equal(expected['1.2MiB.txt'].cid)
          expect(file.unixfs.fileSize()).to.equal(expected['1.2MiB.txt'].size)
        } else if (file.path === 'pam/pum') {
          expect(file.cid).to.equal(expected['pam/pum'].cid)
        } else if (file.path === 'pam/1.2MiB.txt') {
          expect(file.cid).to.equal(expected['1.2MiB.txt'].cid)
          expect(file.unixfs.fileSize()).to.equal(expected['1.2MiB.txt'].size)
        } else if (file.path === 'pam') {
          expect(file.cid).to.equal(expected.pam.cid)
        } else {
          throw new Error(`Unexpected path ${file.path}`)
        }
      }
    })

    it('will not write to disk if passed "onlyHash" option', async () => {
      const content = String(Math.random() + Date.now())
      const files = await all(importer([{
        path: content + '.txt',
        content: asAsyncIterable(uint8ArrayFromString(content))
      }], block, {
        onlyHash: true
      }))

      const file = files[0]
      expect(file).to.exist()

      try {
        await block.get(file.cid)

        throw new Error('No error was thrown')
      } catch (err) {
        expect(err.code).to.equal('ERR_NOT_FOUND')
      }
    })

    it('will call an optional progress function', async () => {
      const maxChunkSize = 2048
      const path = '1.2MiB.txt'

      const options = {
        progress: sinon.spy(),
        maxChunkSize
      }

      await all(importer([{
        path,
        content: asAsyncIterable(bigFile)
      }], block, options))

      expect(options.progress.called).to.equal(true)
      expect(options.progress.args[0]).to.deep.equal([maxChunkSize, path])
    })

    it('will import files with CID version 1', async () => {
      /**
       * @param {string} path
       * @param {number} size
       */
      const createInputFile = (path, size) => {
        const name = String(Math.random() + Date.now())
        path = path[path.length - 1] === '/' ? path : path + '/'
        return {
          path: path + name + '.txt',
          content: new Uint8Array(size).fill(1)
        }
      }

      const inputFiles = [
        createInputFile('foo', 10),
        createInputFile('foo', 60),
        createInputFile('foo/bar', 78),
        createInputFile('foo/baz', 200),
        // Bigger than maxChunkSize
        createInputFile('foo', 262144 + 45),
        createInputFile('foo/bar', 262144 + 134),
        createInputFile('foo/bar', 262144 + 79),
        createInputFile('foo/bar', 262144 + 876),
        createInputFile('foo/bar', 262144 + 21)
      ]

      /** @type {import('ipfs-unixfs-importer').UserImporterOptions} */
      const options = {
        cidVersion: 1,
        // Ensures we use DirSharded for the data below
        shardSplitThreshold: 3
      }

      const files = await all(importer(inputFiles.map(file => ({
        ...file,
        content: asAsyncIterable(file.content)
      })), block, options))

      const file = files[0]
      expect(file).to.exist()

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (file.unixfs?.isDirectory()) {
          // ignore directories
          continue
        }

        const cid = file.cid.toV1()
        const inputFile = inputFiles.find(f => f.path === file.path)

        if (!inputFile) {
          throw new Error('Could not find input file with path ' + file.path)
        }

        // Just check the intermediate directory can be retrieved
        if (!inputFile) {
          await block.get(cid)
        }

        // Check the imported content is correct
        const node = await exporter(cid, block)

        if (node.type !== 'file') {
          throw new Error('Unexpected type')
        }

        expect(uint8ArrayConcat(await all(node.content()))).to.deep.equal(inputFile.content)
      }
    })

    it('imports file with raw leaf nodes when specified', () => {
      return checkLeafNodeTypes(block, {
        leafType: 'raw'
      }, 'raw')
    })

    it('imports file with file leaf nodes when specified', () => {
      return checkLeafNodeTypes(block, {
        leafType: 'file'
      }, 'file')
    })

    it('reduces file to single node when specified', () => {
      return checkNodeLinks(block, {
        reduceSingleLeafToSelf: true
      }, 0)
    })

    it('does not reduce file to single node when overidden by options', () => {
      return checkNodeLinks(block, {
        reduceSingleLeafToSelf: false
      }, 1)
    })

    it('uses raw leaf nodes when requested', async () => {
      this.timeout(60 * 1000)

      const options = {
        rawLeaves: true
      }

      for await (const file of importer([{
        path: '1.2MiB.txt',
        content: asAsyncIterable(bigFile)
      }], block, options)) {
        for await (const { cid } of collectLeafCids(file.cid, block)) {
          expect(cid).to.have.property('codec', 'raw')
          expect(cid).to.have.property('version', 1)
        }
      }
    })

    it('supports passing mtime', async () => {
      this.timeout(60 * 1000)

      const options = {
        rawLeaves: true
      }
      const now = new Date()

      for await (const file of importer([{
        path: '1.2MiB.txt',
        content: asAsyncIterable(bigFile),
        mtime: parseMtime(now)
      }], block, options)) {
        const node = await exporter(file.cid, block)

        expect(node).to.have.deep.nested.property('unixfs.mtime', dateToTimespec(now))
      }
    })

    it('supports passing mtime for directories', async () => {
      this.timeout(60 * 1000)

      const now = new Date()

      const entries = await all(importer([{
        path: '/foo',
        mtime: parseMtime(now)
      }], block))

      const node = await exporter(entries[0].cid, block)
      expect(node).to.have.deep.nested.property('unixfs.mtime', dateToTimespec(now))
    })

    it('supports passing metadata for wrapping directories', async () => {
      this.timeout(60 * 1000)

      const now = new Date()
      const perms = 0o0777

      const entries = await all(importer([{
        path: '/foo',
        mtime: parseMtime(now),
        mode: perms
      }, {
        path: '/foo/bar.txt',
        content: asAsyncIterable(bigFile)
      }], block))

      const nodes = await all(recursive(entries[entries.length - 1].cid, block))
      const node = nodes.filter(node => node.type === 'directory').pop()

      if (!node) {
        expect.fail('no directory found')
      }

      expect(node).to.have.deep.nested.property('unixfs.mtime', dateToTimespec(now))
      expect(node).to.have.nested.property('unixfs.mode', perms)
    })

    it('supports passing metadata for intermediate directories', async () => {
      this.timeout(60 * 1000)

      const now = new Date()
      const perms = 0o0777

      const entries = await all(importer([{
        path: '/foo/bar',
        mtime: parseMtime(now),
        mode: perms
      }, {
        path: '/foo/bar/baz.txt',
        content: asAsyncIterable(bigFile)
      }], block))

      const nodes = await all(recursive(entries[entries.length - 1].cid, block))
      const node = nodes.filter(node => node.type === 'directory').pop()

      if (!node) {
        expect.fail('no directory found')
      }

      expect(node).to.have.deep.nested.property('unixfs.mtime', dateToTimespec(now))
      expect(node).to.have.nested.property('unixfs.mode', perms)
    })

    it('supports passing metadata for out of order intermediate directories', async () => {
      this.timeout(60 * 1000)

      const now = new Date()
      const perms = 0o0777

      const entries = await all(importer([{
        path: '/foo/bar/qux.txt',
        content: asAsyncIterable(bigFile)
      }, {
        path: '/foo/bar',
        mtime: parseMtime(now),
        mode: perms
      }, {
        path: '/foo/quux'
      }, {
        path: '/foo/bar/baz.txt',
        content: asAsyncIterable(bigFile)
      }], block))

      const nodes = await all(recursive(entries[entries.length - 1].cid, block))
      const node = nodes.filter(node => node.type === 'directory' && node.name === 'bar').pop()

      if (!node) {
        expect.fail('no directory found')
      }

      expect(node).to.have.deep.nested.property('unixfs.mtime', dateToTimespec(now))
      expect(node).to.have.nested.property('unixfs.mode', perms)
    })

    it('supports passing mtime for hamt-sharded-directories', async () => {
      this.timeout(60 * 1000)

      const now = new Date()

      const entries = await all(importer([{
        path: '/foo',
        mtime: parseMtime(now)
      }, {
        path: '/foo/bar.txt',
        content: asAsyncIterable(bigFile)
      }, {
        path: '/foo/baz.txt',
        content: asAsyncIterable(bigFile)
      }, {
        path: '/foo/qux'
      }], block, {
        shardSplitThreshold: 0
      }))

      const nodes = await all(recursive(entries[entries.length - 1].cid, block))
      const node = nodes.filter(node => node.type === 'directory' && node.unixfs.type === 'hamt-sharded-directory').pop()

      if (!node) {
        expect.fail('no hamt-sharded-directory found')
      }

      expect(node).to.have.deep.nested.property('unixfs.mtime', dateToTimespec(now))
    })

    it('supports passing mode', async () => {
      this.timeout(60 * 1000)

      const options = {
        rawLeaves: true
      }
      const mode = 0o0111

      for await (const file of importer([{
        path: '1.2MiB.txt',
        content: asAsyncIterable(bigFile),
        mode
      }], block, options)) {
        const node = await exporter(file.cid, block)

        expect(node).to.have.nested.property('unixfs.mode', mode)
      }
    })

    it('supports passing mode for directories', async () => {
      this.timeout(60 * 1000)

      const mode = 0o0111

      const entries = await all(importer([{
        path: '/foo',
        mode
      }], block))

      const node = await exporter(entries[0].cid, block)
      expect(node).to.have.nested.property('unixfs.mode', mode)
    })

    it('supports passing different modes for different files', async () => {
      this.timeout(60 * 1000)

      const mode1 = 0o0111
      const mode2 = 0o0222

      const entries = await all(importer([{
        path: '/foo/file1.txt',
        content: asAsyncIterable(bigFile),
        mode: mode1
      }, {
        path: '/foo/file2.txt',
        content: asAsyncIterable(bigFile),
        mode: mode2
      }], block))

      const node1 = await exporter(entries[0].cid, block)
      expect(node1).to.have.nested.property('unixfs.mode', mode1)

      const node2 = await exporter(entries[1].cid, block)
      expect(node2).to.have.nested.property('unixfs.mode', mode2)
    })

    it('supports deeply nested files do not inherit custom metadata', async () => {
      this.timeout(60 * 1000)

      const mode = 0o0111

      const entries = await all(importer([{
        path: '/foo/file1.txt',
        content: asAsyncIterable(bigFile),
        mode: mode
      }, {
        path: '/foo/bar/baz/file2.txt',
        content: asAsyncIterable(bigFile)
      }], block))

      const node1 = await exporter(entries[0].cid, block)
      expect(node1).to.have.nested.property('unixfs.mode', mode)

      const node2 = await exporter(entries[1].cid, block)
      expect(node2).to.have.nested.property('unixfs.mode').that.does.not.equal(mode)
    })

    it('files and directories get default mode if not specified', async () => {
      this.timeout(60 * 1000)

      const entries = await all(importer([{
        path: '/foo/file1.txt',
        content: asAsyncIterable(bigFile)
      }], block))

      const node1 = await exporter(entries[0].cid, block)
      expect(node1).to.have.nested.property('unixfs.mode', 0o0644)

      const node2 = await exporter(entries[1].cid, block)
      expect(node2).to.have.nested.property('unixfs.mode', 0o0755)
    })
  })
})

describe('configuration', () => {
  /** @type {BlockAPI} */
  const block = blockApi()

  it('alllows configuring with custom dag and tree builder', async () => {
    let builtTree = false
    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
    const unixfs = new UnixFS({ type: 'directory' })

    // @ts-expect-error custom dag builder expects weird data
    const entries = await all(importer([{
      path: 'path',
      content: 'content'
    }], block, {
      /** @type {import('ipfs-unixfs-importer/src/types').DAGBuilder} */
      dagBuilder: async function * (source, block, opts) { // eslint-disable-line require-await
        yield function () {
          return Promise.resolve({
            cid,
            path: 'path',
            unixfs,
            size: 0
          })
        }
      },
      /** @type {import('ipfs-unixfs-importer/src/types').TreeBuilder} */
      treeBuilder: async function * (source, block, opts) { // eslint-disable-line require-await
        builtTree = true
        yield * source
      }
    }))

    expect(entries).to.have.lengthOf(1)
    expect(entries).to.have.deep.nested.property('[0].cid', cid)
    expect(entries).to.have.nested.property('[0].path', 'path')
    expect(entries).to.have.deep.nested.property('[0].unixfs', unixfs)

    expect(builtTree).to.be.true()
  })

  it('allows configuring with custom chunker', async () => {
    let validated = false
    let chunked = false
    const entries = await all(importer([{
      path: 'path',
      content: asAsyncIterable(uint8ArrayFromString('content'))
    }], block, {
      /** @type {import('ipfs-unixfs-importer').ChunkValidator} */
      chunkValidator: async function * (source) { // eslint-disable-line require-await
        validated = true

        for await (const str of source) {
          if (typeof str === 'string') {
            yield uint8ArrayFromString(str)
          } else {
            yield Uint8Array.from(str)
          }
        }
      },
      /** @type {import('ipfs-unixfs-importer').Chunker} */
      chunker: async function * (source) { // eslint-disable-line require-await
        chunked = true
        yield * source
      }
    }))

    expect(entries).to.have.lengthOf(1)
    expect(entries).to.have.nested.property('[0].path', 'path')
    expect(entries).to.have.nested.property('[0].unixfs')

    expect(validated).to.be.true()
    expect(chunked).to.be.true()
  })

  it('imports the same data with different CID versions and gets the same multihash', async () => {
    const buf = uint8ArrayFromString('content')

    const result = await last(importer([{
      content: asAsyncIterable(buf)
    }], block, {
      cidVersion: 0,
      rawLeaves: false
    }))

    if (!result) {
      throw new Error('Nothing imported')
    }

    const { cid: cidV0 } = result

    const result2 = await last(importer([{
      content: asAsyncIterable(buf)
    }], block, {
      cidVersion: 1,
      rawLeaves: false
    }))

    if (!result2) {
      throw new Error('Nothing imported')
    }

    const { cid: cidV1 } = result2

    expect(cidV0.multihash).to.deep.equal(cidV1.multihash)
  })
})
