/* eslint-env mocha */
'use strict'

const importer = require('../src')
const exporter = require('ipfs-unixfs-exporter')
const { Buffer } = require('buffer')
const extend = require('merge-options')
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const spy = require('sinon/lib/sinon/spy')
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const UnixFs = require('ipfs-unixfs')
const collectLeafCids = require('./helpers/collect-leaf-cids')
const loadFixture = require('aegir/fixtures')
const isNode = require('detect-node')
const bigFile = loadFixture((isNode ? __dirname : 'test') + '/fixtures/1.2MiB.txt')
const smallFile = loadFixture((isNode ? __dirname : 'test') + '/fixtures/200Bytes.txt')
const all = require('it-all')
const first = require('it-first')
const blockApi = require('./helpers/block')

function stringifyMh (files) {
  return files.map((file) => {
    return {
      ...file,
      cid: file.cid.toBaseEncodedString()
    }
  })
}

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

const checkLeafNodeTypes = async (block, ipld, options, expected) => {
  const file = await first(importer([{
    path: 'foo',
    content: Buffer.alloc(262144 + 5).fill(1)
  }], block, options))

  const node = await ipld.get(file.cid)
  const meta = UnixFs.unmarshal(node.Data)

  expect(meta.type).to.equal('file')
  expect(node.Links.length).to.equal(2)

  const linkedNodes = await Promise.all(
    node.Links.map(link => ipld.get(link.Hash))
  )

  linkedNodes.forEach(node => {
    const meta = UnixFs.unmarshal(node.Data)
    expect(meta.type).to.equal(expected)
  })
}

const checkNodeLinks = async (block, ipld, options, expected) => {
  for await (const file of importer([{
    path: 'foo',
    content: Buffer.alloc(100).fill(1)
  }], block, options)) {
    const node = await ipld.get(file.cid)
    const meta = UnixFs.unmarshal(node.Data)

    expect(meta.type).to.equal('file')
    expect(node.Links.length).to.equal(expected)
  }
}

strategies.forEach((strategy) => {
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
  }, strategyOverrides[strategy])

  const expected = extend({}, defaultResults)

  const expectFiles = (actualFiles, expectedFiles) => {
    expect(actualFiles.length).to.equal(expectedFiles.length)

    for (let i = 0; i < expectedFiles.length; i++) {
      const expectedFile = expected[expectedFiles[i]]
      const actualFile = actualFiles[i]

      expect(actualFile.path).to.equal(expectedFile.path)
      expect(actualFile.cid.toBaseEncodedString('base58btc')).to.equal(expectedFile.cid)

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

    let ipld
    let block
    const options = {
      strategy: strategy
    }

    before(async () => {
      ipld = await inMemory(IPLD)
      block = blockApi(ipld)
    })

    it('fails on bad content', async () => {
      try {
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
      const files = await all(importer([], ipld, options))

      expect(files).to.be.empty()
    })

    it('doesn\'t yield anything on empty file', async () => {
      const files = await all(importer([{
        path: 'emptyfile',
        content: Buffer.alloc(0)
      }], block, options))

      expect(files.length).to.eql(1)

      // always yield empty file node
      expect(files[0].cid.toBaseEncodedString()).to.eql('QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH')
    })

    it('fails on more than one root', async () => {
      try {
        await all(importer([{
          path: 'beep/200Bytes.txt',
          content: smallFile
        }, {
          path: 'boop/200Bytes.txt',
          content: bigFile
        }], block, options))

        throw new Error('No error was thrown')
      } catch (err) {
        expect(err.code).to.equal('ERR_MORE_THAN_ONE_ROOT')
      }
    })

    it('accepts strings as content', async () => {
      const content = 'I am a string'
      const res = await all(importer([{
        path: '200Bytes.txt',
        content
      }], block, options))

      const file = await exporter(res[0].cid, ipld)
      const fileContent = await all(file.content())

      expect(fileContent.toString()).to.equal(content)
    })

    it('small file with an escaped slash in the title', async () => {
      const filePath = `small-\\/file-${Math.random()}.txt`
      const files = await all(importer([{
        path: filePath,
        content: smallFile
      }], block, options))

      expect(files.length).to.equal(1)
      expect(files[0].path).to.equal(filePath)
    })

    it('small file with square brackets in the title', async () => {
      const filePath = `small-[v]-file-${Math.random()}.txt`
      const files = await all(importer([{
        path: filePath,
        content: smallFile
      }], block, options))

      expect(files.length).to.equal(1)
      expect(files[0].path).to.equal(filePath)
    })

    it('small file as buffer (smaller than a chunk)', async () => {
      const files = await all(importer([{
        path: '200Bytes.txt',
        content: smallFile
      }], block, options))

      expectFiles(files, [
        '200Bytes.txt'
      ])
    })

    it('small file as array (smaller than a chunk)', async () => {
      const files = await all(importer([{
        path: '200Bytes.txt',
        content: Array.from(smallFile)
      }], block, options))

      expectFiles(files, [
        '200Bytes.txt'
      ])
    })

    it('small file as string (smaller than a chunk)', async () => {
      const files = await all(importer([{
        path: 'small.txt',
        content: 'this is a file\n'
      }], block, options))

      expectFiles(files, [
        'small.txt'
      ])
    })

    it('small file (smaller than a chunk) with raw leaves', async () => {
      const files = await all(importer([{
        path: '200Bytes.txt',
        content: smallFile
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
        content: smallFile,
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
        content: smallFile,
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
        content: smallFile,
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
        content: smallFile
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
        content: bigFile
      }], block, options))

      expectFiles(files, [
        '1.2MiB.txt'
      ])
    })

    it('file bigger than a single chunk inside a dir', async () => {
      this.timeout(60 * 1000)

      const files = await all(importer([{
        path: 'foo-big/1.2MiB.txt',
        content: bigFile
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
        content: smallFile
      }, {
        path: 'pim/1.2MiB.txt',
        content: bigFile
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
        content: smallFile
      }, {
        path: 'pam/pum/1.2MiB.txt',
        content: bigFile
      }, {
        path: 'pam/1.2MiB.txt',
        content: bigFile
      }], block, options))

      const result = stringifyMh(files)

      expect(result.length).to.equal(5)

      result.forEach(eachFile)

      function eachFile (file) {
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
        content: Buffer.from(content)
      }], block, {
        onlyHash: true
      }))

      const file = files[0]
      expect(file).to.exist()

      try {
        await ipld.get(file.cid)

        throw new Error('No error was thrown')
      } catch (err) {
        expect(err.code).to.equal('ERR_NOT_FOUND')
      }
    })

    it('will call an optional progress function', async () => {
      const maxChunkSize = 2048

      const options = {
        progress: spy(),
        maxChunkSize
      }

      await all(importer([{
        path: '1.2MiB.txt',
        content: bigFile
      }], block, options))

      expect(options.progress.called).to.equal(true)
      expect(options.progress.args[0][0]).to.equal(maxChunkSize)
    })

    it('will import files with CID version 1', async () => {
      const createInputFile = (path, size) => {
        const name = String(Math.random() + Date.now())
        path = path[path.length - 1] === '/' ? path : path + '/'
        return {
          path: path + name + '.txt',
          content: Buffer.alloc(size).fill(1)
        }
      }

      const inputFiles = [
        createInputFile('/foo', 10),
        createInputFile('/foo', 60),
        createInputFile('/foo/bar', 78),
        createInputFile('/foo/baz', 200),
        // Bigger than maxChunkSize
        createInputFile('/foo', 262144 + 45),
        createInputFile('/foo/bar', 262144 + 134),
        createInputFile('/foo/bar', 262144 + 79),
        createInputFile('/foo/bar', 262144 + 876),
        createInputFile('/foo/bar', 262144 + 21)
      ]

      const options = {
        cidVersion: 1,
        // Ensures we use DirSharded for the data below
        shardSplitThreshold: 3
      }

      // Pass a copy of inputFiles, since the importer mutates them
      const files = await all(importer(inputFiles.map(f => Object.assign({}, f)), block, options))

      const file = files[0]
      expect(file).to.exist()

      for (let i = 0; i < file.length; i++) {
        const file = files[i]

        const cid = file.cid.toV1()
        const inputFile = inputFiles.find(f => f.path === file.path)

        // Just check the intermediate directory can be retrieved
        if (!inputFile) {
          await ipld.get(cid)
        }

        // Check the imported content is correct
        const node = await exporter(cid, ipld)
        const chunks = []

        for await (const chunk of node.content()) {
          chunks.push(chunk)
        }

        expect(Buffer.concat(chunks)).to.deep.equal(inputFile.content)
      }
    })

    it('imports file with raw leaf nodes when specified', () => {
      return checkLeafNodeTypes(block, ipld, {
        leafType: 'raw'
      }, 'raw')
    })

    it('imports file with file leaf nodes when specified', () => {
      return checkLeafNodeTypes(block, ipld, {
        leafType: 'file'
      }, 'file')
    })

    it('reduces file to single node when specified', () => {
      return checkNodeLinks(block, ipld, {
        reduceSingleLeafToSelf: true
      }, 0)
    })

    it('does not reduce file to single node when overidden by options', () => {
      return checkNodeLinks(block, ipld, {
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
        content: bigFile
      }], block, options)) {
        for await (const { cid } of collectLeafCids(file.cid, ipld)) {
          expect(cid.codec).to.be('raw')
          expect(cid.version).to.be(1)
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
        content: bigFile,
        mtime: now
      }], block, options)) {
        const node = await exporter(file.cid, ipld)

        expect(node).to.have.nested.deep.property('unixfs.mtime', dateToTimespec(now))
      }
    })

    it('supports passing mtime for directories', async () => {
      this.timeout(60 * 1000)

      const now = new Date()

      const entries = await all(importer([{
        path: '/foo',
        mtime: now
      }], block))

      const node = await exporter(entries[0].cid, ipld)
      expect(node).to.have.nested.deep.property('unixfs.mtime', dateToTimespec(now))
    })

    it('supports passing metadata for wrapping directories', async () => {
      this.timeout(60 * 1000)

      const now = new Date()
      const perms = 0o0777

      const entries = await all(importer([{
        path: '/foo',
        mtime: now,
        mode: perms
      }, {
        path: '/foo/bar.txt',
        content: bigFile
      }], block))

      const nodes = await all(exporter.recursive(entries[entries.length - 1].cid, ipld))
      const node = nodes.filter(node => node.unixfs.type === 'directory').pop()

      if (!node) {
        expect.fail('no directory found')
      }

      expect(node).to.have.nested.deep.property('unixfs.mtime', dateToTimespec(now))
      expect(node).to.have.nested.property('unixfs.mode', perms)
    })

    it('supports passing metadata for intermediate directories', async () => {
      this.timeout(60 * 1000)

      const now = new Date()
      const perms = 0o0777

      const entries = await all(importer([{
        path: '/foo/bar',
        mtime: now,
        mode: perms
      }, {
        path: '/foo/bar/baz.txt',
        content: bigFile
      }], block))

      const nodes = await all(exporter.recursive(entries[entries.length - 1].cid, ipld))
      const node = nodes.filter(node => node.unixfs.type === 'directory').pop()

      if (!node) {
        expect.fail('no directory found')
      }

      expect(node).to.have.nested.deep.property('unixfs.mtime', dateToTimespec(now))
      expect(node).to.have.nested.property('unixfs.mode', perms)
    })

    it('supports passing metadata for out of order intermediate directories', async () => {
      this.timeout(60 * 1000)

      const now = new Date()
      const perms = 0o0777

      const entries = await all(importer([{
        path: '/foo/bar/qux.txt',
        content: bigFile
      }, {
        path: '/foo/bar',
        mtime: now,
        mode: perms
      }, {
        path: '/foo/quux'
      }, {
        path: '/foo/bar/baz.txt',
        content: bigFile
      }], block))

      const nodes = await all(exporter.recursive(entries[entries.length - 1].cid, ipld))
      const node = nodes.filter(node => node.unixfs.type === 'directory' && node.name === 'bar').pop()

      if (!node) {
        expect.fail('no directory found')
      }

      expect(node).to.have.nested.deep.property('unixfs.mtime', dateToTimespec(now))
      expect(node).to.have.nested.property('unixfs.mode', perms)
    })

    it('supports passing mtime for hamt-sharded-directories', async () => {
      this.timeout(60 * 1000)

      const now = new Date()

      const entries = await all(importer([{
        path: '/foo',
        mtime: now
      }, {
        path: '/foo/bar.txt',
        content: bigFile
      }, {
        path: '/foo/baz.txt',
        content: bigFile
      }, {
        path: '/foo/qux'
      }], block, {
        shardSplitThreshold: 0
      }))

      const nodes = await all(exporter.recursive(entries[entries.length - 1].cid, ipld))
      const node = nodes.filter(node => node.unixfs.type === 'hamt-sharded-directory').pop()

      if (!node) {
        expect.fail('no hamt-sharded-directory found')
      }

      expect(node).to.have.nested.deep.property('unixfs.mtime', dateToTimespec(now))
    })

    it('supports passing mode', async () => {
      this.timeout(60 * 1000)

      const options = {
        rawLeaves: true
      }
      const mode = 0o0111

      for await (const file of importer([{
        path: '1.2MiB.txt',
        content: bigFile,
        mode
      }], block, options)) {
        const node = await exporter(file.cid, ipld)

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

      const node = await exporter(entries[0].cid, ipld)
      expect(node).to.have.nested.property('unixfs.mode', mode)
    })

    it('supports passing different modes for different files', async () => {
      this.timeout(60 * 1000)

      const mode1 = 0o0111
      const mode2 = 0o0222

      const entries = await all(importer([{
        path: '/foo/file1.txt',
        content: bigFile,
        mode: mode1
      }, {
        path: '/foo/file2.txt',
        content: bigFile,
        mode: mode2
      }], block))

      const node1 = await exporter(entries[0].cid, ipld)
      expect(node1).to.have.nested.property('unixfs.mode', mode1)

      const node2 = await exporter(entries[1].cid, ipld)
      expect(node2).to.have.nested.property('unixfs.mode', mode2)
    })

    it('supports deeply nested files do not inherit custom metadata', async () => {
      this.timeout(60 * 1000)

      const mode = 0o0111

      const entries = await all(importer([{
        path: '/foo/file1.txt',
        content: bigFile,
        mode: mode
      }, {
        path: '/foo/bar/baz/file2.txt',
        content: bigFile
      }], block))

      const node1 = await exporter(entries[0].cid, ipld)
      expect(node1).to.have.nested.property('unixfs.mode', mode)

      const node2 = await exporter(entries[1].cid, ipld)
      expect(node2).to.have.nested.property('unixfs.mode').that.does.not.equal(mode)
    })

    it('files and directories get default mode if not specified', async () => {
      this.timeout(60 * 1000)

      const entries = await all(importer([{
        path: '/foo/file1.txt',
        content: bigFile
      }], block))

      const node1 = await exporter(entries[0].cid, ipld)
      expect(node1).to.have.nested.property('unixfs.mode', 0o0644)

      const node2 = await exporter(entries[1].cid, ipld)
      expect(node2).to.have.nested.property('unixfs.mode', 0o0755)
    })
  })
})

describe('configuration', () => {
  it('alllows configuring with custom dag and tree builder', async () => {
    let builtTree = false
    const block = 'block'
    const entries = await all(importer([{
      path: 'path',
      content: 'content'
    }], block, {
      dagBuilder: async function * (source, block, opts) { // eslint-disable-line require-await
        yield function () {
          return Promise.resolve({
            cid: 'cid',
            path: 'path',
            unixfs: 'unixfs'
          })
        }
      },
      treeBuilder: async function * (source, block, opts) { // eslint-disable-line require-await
        builtTree = true
        yield * source
      }
    }))

    expect(entries).to.have.lengthOf(1)
    expect(entries).to.have.nested.property('[0].cid', 'cid')
    expect(entries).to.have.nested.property('[0].path', 'path')
    expect(entries).to.have.nested.property('[0].unixfs', 'unixfs')

    expect(builtTree).to.be.true()
  })

  it('alllows configuring with custom chunker', async () => {
    let validated = false
    let chunked = false
    const block = {
      put: () => {}
    }
    const entries = await all(importer([{
      path: 'path',
      content: 'content'
    }], block, {
      chunkValidator: async function * (source, opts) { // eslint-disable-line require-await
        validated = true
        yield * source
      },
      chunker: async function * (source, opts) { // eslint-disable-line require-await
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
})
