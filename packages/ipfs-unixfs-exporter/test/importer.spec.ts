/* eslint-env mocha */

import { decode } from '@ipld/dag-pb'
import { expect } from 'aegir/chai'
import loadFixture from 'aegir/fixtures'
import { MemoryBlockstore } from 'blockstore-core'
import { UnixFS } from 'ipfs-unixfs'
import { importer } from 'ipfs-unixfs-importer'
import { fixedSize } from 'ipfs-unixfs-importer/chunker'
import { balanced, flat, trickle } from 'ipfs-unixfs-importer/layout'
import all from 'it-all'
import filter from 'it-filter'
import first from 'it-first'
import last from 'it-last'
import map from 'it-map'
import toBuffer from 'it-to-buffer'
// @ts-expect-error https://github.com/schnittstabil/merge-options/pull/28
import extend from 'merge-options'
import { base58btc } from 'multiformats/bases/base58'
import { CID } from 'multiformats/cid'
import sinon from 'sinon'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { exporter, recursive } from '../src/index.js'
import asAsyncIterable from './helpers/as-async-iterable.ts'
import collectLeafCids from './helpers/collect-leaf-cids.ts'
import type { Blockstore } from 'interface-blockstore'
import type { Mtime } from 'ipfs-unixfs'
import type { ImporterOptions } from 'ipfs-unixfs-importer'
import type { FileLayout } from 'ipfs-unixfs-importer/layout'

const bigFile = loadFixture('test/fixtures/1.2MiB.txt')
const smallFile = loadFixture('test/fixtures/200Bytes.txt')

function stringifyMh (files: Array<{ path?: string, cid: CID, unixfs?: UnixFS }>): Array<{ cid: string, path?: string, unixfs?: UnixFS }> {
  return files.map((file) => {
    return {
      ...file,
      cid: file.cid.toString()
    }
  })
}

function dateToTimespec (date: Date): Mtime {
  const ms = date.getTime()
  const secs = Math.floor(ms / 1000)

  return {
    secs: BigInt(secs),
    nsecs: (ms - (secs * 1000)) * 1000
  }
}

interface File {
  cid: string
  size: bigint
  type: string
  path: string
}

const baseFiles: Record<string, File> = {
  '200Bytes.txt': {
    cid: 'QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8',
    size: 200n,
    type: 'file',
    path: '200Bytes.txt'
  },
  '1.2MiB.txt': {
    cid: 'QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q',
    size: 1258000n,
    type: 'file',
    path: '1.2MiB.txt'
  },
  'small.txt': {
    cid: 'QmZMb7HWpbevpcdhbUV1ZZgdji8vh5uQ13KxczChGrK9Rd',
    size: 15n,
    type: 'file',
    path: 'small.txt'
  }
}

const strategyBaseFiles: Record<string, Record<string, File>> = {
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
      size: 200n,
      type: 'file',
      path: '200Bytes.txt'
    },
    '1.2MiB.txt': {
      cid: 'QmfAxsHrpaLLuhbqqbo9KQyvQNawMnVSwutYoJed75pnco',
      type: 'file'
    }
  })
}

const strategies: Array<'flat' | 'balanced' | 'trickle'> = [
  'flat',
  'balanced',
  'trickle'
]

const strategyOverrides: Record<string, Record<string, File>> = {
  balanced: {
    'foo-big': {
      cid: 'QmaFgyFJUP4fxFySJCddg2Pj6rpwSywopWk87VEVv52RSj',
      path: 'foo-big',
      size: 1335478n,
      type: 'directory'
    },
    pim: {
      cid: 'QmY8a78tx6Tk6naDgWCgTsd9EqGrUJRrH7dDyQhjyrmH2i',
      path: 'pim',
      size: 1335744n,
      type: 'directory'
    },
    'pam/pum': {
      cid: 'QmY8a78tx6Tk6naDgWCgTsd9EqGrUJRrH7dDyQhjyrmH2i',
      path: 'pam/pum',
      size: 1335744n,
      type: 'directory'
    },
    pam: {
      cid: 'QmRgdtzNx1H1BPJqShdhvWZ2D4DA2HUgZJ3XLtoXei27Av',
      path: 'pam',
      size: 2671269n,
      type: 'directory'
    }
  },
  trickle: {
    'foo-big': {
      cid: 'QmaKbhFRy9kcCbcwrLsqYHWMiY44BDYkqTCMpAxDdd2du2',
      path: 'foo-big',
      size: 1334657n,
      type: 'directory'
    },
    pim: {
      cid: 'QmbWGdnua4YuYpWJb7fE25PRbW9GbKKLqq9Ucmnsg2gxnt',
      path: 'pim',
      size: 1334923n,
      type: 'directory'
    },
    'pam/pum': {
      cid: 'QmbWGdnua4YuYpWJb7fE25PRbW9GbKKLqq9Ucmnsg2gxnt',
      path: 'pam/pum',
      size: 1334923n,
      type: 'directory'
    },
    pam: {
      cid: 'QmSuh47G9Qm3PFv1zziojtHxqCjuurSdtWAzxLxoKJPq2U',
      path: 'pam',
      size: 2669627n,
      type: 'directory'
    },
    '200Bytes.txt with raw leaves': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmagyRwMfYhczYNv5SvcJc8xxXjZQBTTHS2jEqNMva2mYT',
      size: 200n
    }),
    '200Bytes.txt with raw leaves and mode': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmRYYSoRkL9bh5gzbgHndWjt81TYnM4W7MjzTp8WWioLGB',
      size: 200n
    }),
    '200Bytes.txt with raw leaves and mtime': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmQ1QHqXqgxJ4qjJZouRdYG7pdS6yzdhSAq7dYAu9bN6h4',
      size: 200n
    }),
    '200Bytes.txt with raw leaves and metadata': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmWUpftnvHN1Ey5iGoaWwMUZPnViXeJctDSUkcvunkahFo',
      size: 200n
    }),
    'foo/bar': {
      cid: 'QmTGMxKPzSGNBDp6jhTwnZxGW6w1S9ciyycRJ4b2qcQaHK',
      size: 0n,
      path: 'foo/bar',
      type: 'directory'
    },
    foo: {
      cid: 'Qme4A8fZmwfZESappfPcxSMTZVACiEzhHKtYRMuM1hbkDp',
      size: 0n,
      path: 'foo',
      type: 'directory'
    },
    'small.txt': {
      cid: 'QmXmZ3qT328JxWtQXqrmvma2FmPp7tMdNiSuYvVJ5QRhKs',
      size: 15n,
      type: 'file',
      path: 'small.txt'
    }
  }
}

const checkLeafNodeTypes = async (blockstore: Blockstore, options: Partial<ImporterOptions>, expected: any): Promise<void> => {
  const file = await first(importer([{
    path: 'foo',
    content: asAsyncIterable(new Uint8Array(262144 + 5).fill(1))
  }], blockstore, options))

  if (file == null) {
    throw new Error('Nothing imported')
  }

  const fileBlock = await toBuffer(blockstore.get(file.cid))
  const node = decode(fileBlock)
  if (node.Data == null) {
    throw new Error('PBNode Data undefined')
  }
  const meta = UnixFS.unmarshal(node.Data)

  expect(meta.type).to.equal('file')
  expect(node.Links.length).to.equal(2)

  const linkedBlocks = await Promise.all(
    node.Links.map(async link => toBuffer(blockstore.get(link.Hash)))
  )

  linkedBlocks.forEach(bytes => {
    const node = decode(bytes)
    if (node.Data == null) {
      throw new Error('PBNode Data undefined')
    }
    const meta = UnixFS.unmarshal(node.Data)
    expect(meta.type).to.equal(expected)
  })
}

const checkNodeLinks = async (blockstore: Blockstore, options: Partial<ImporterOptions>, expected: any): Promise<void> => {
  for await (const file of importer([{
    path: 'foo',
    content: asAsyncIterable(new Uint8Array(100).fill(1))
  }], blockstore, options)) {
    const fileBlock = await toBuffer(blockstore.get(file.cid))
    const node = decode(fileBlock)
    if (node.Data == null) {
      throw new Error('PBNode Data undefined')
    }
    const meta = UnixFS.unmarshal(node.Data)

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
      size: 320n,
      type: 'directory'
    },
    'foo/bar': {
      path: 'foo/bar',
      cid: 'Qmf5BQbTUyUAvd6Ewct83GYGnE1F6btiC3acLhR8MDxgkD',
      size: 270n,
      type: 'directory'
    },
    'foo-big/1.2MiB.txt': extend({}, baseFiles['1.2MiB.txt'], {
      path: 'foo-big/1.2MiB.txt'
    }),
    'foo-big': {
      path: 'foo-big',
      cid: 'QmaFgyFJUP4fxFySJCddg2Pj6rpwSywopWk87VEVv52RSj',
      size: 1328120n,
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
      size: 1328386n,
      type: 'directory'
    },
    'empty-dir': {
      path: 'empty-dir',
      cid: 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn',
      size: 4n,
      type: 'directory'
    },
    'pam/pum': {
      cid: 'QmY8a78tx6Tk6naDgWCgTsd9EqGrUJRrH7dDyQhjyrmH2i',
      path: 'pam/pum',
      size: 1328386n,
      type: 'directory'
    },
    pam: {
      cid: 'QmRgdtzNx1H1BPJqShdhvWZ2D4DA2HUgZJ3XLtoXei27Av',
      path: 'pam',
      size: 2656553n,
      type: 'directory'
    },
    '200Bytes.txt with raw leaves': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'zb2rhXrz1gkCv8p4nUDZRohY6MzBE9C3HVTVDP72g6Du3SD9Q'
    }),
    '200Bytes.txt with raw leaves and mode': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmWXbKV9BKJqd8x1NUw1myH987bURrn9Rna3rszYJgQwtX',
      size: 200n
    }),
    '200Bytes.txt with raw leaves and mtime': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmYfLToWgeJwrFFKideGNaS1zkmrow1a9o862sUL43NapC',
      size: 200n
    }),
    '200Bytes.txt with raw leaves and metadata': extend({}, baseFiles['200Bytes.txt'], {
      cid: 'QmVfHowk2oKuWFyVwSRt8H1dQ3v272jyWSwhfQnTtWNmfw',
      size: 200n
    })
  }, strategyOverrides[strategy])

  const expected = extend({}, defaultResults)

  const expectFiles = (actualFiles: any, expectedFiles: any): void => {
    expect(actualFiles.length).to.equal(expectedFiles.length)

    for (let i = 0; i < expectedFiles.length; i++) {
      const expectedFile = expected[expectedFiles[i]]
      const actualFile = actualFiles[i]

      expect(actualFile.path).to.equal(expectedFile.path)
      expect(actualFile.cid.toString(base58btc)).to.equal(expectedFile.cid.toString())

      if (actualFile.unixfs != null) {
        expect(actualFile.unixfs.type).to.equal(expectedFile.type)

        if (actualFile.unixfs.type === 'file') {
          expect(actualFile.unixfs.fileSize()).to.equal(expectedFile.size)
        }
      }
    }
  }

  describe('importer: ' + strategy, function () {
    this.timeout(30 * 1000)

    let layout: FileLayout

    if (strategy === 'balanced') {
      layout = balanced()
    } else if (strategy === 'flat') {
      layout = flat()
    } else if (strategy === 'trickle') {
      layout = trickle()
    } else {
      throw new Error('Unknown strategy')
    }

    const block = new MemoryBlockstore()
    const options: Partial<ImporterOptions> = {
      layout,
      rawLeaves: false,
      cidVersion: 0
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
      } catch (err: any) {
        expect(err.code).to.equal('ERR_INVALID_CONTENT')
      }
    })

    it('fails on an iterator that yields bad content', async () => {
      try {
        // @ts-expect-error bad content
        await all(importer([{
          path: '200Bytes.txt',
          content: {
            [Symbol.iterator]: function * () {
              yield 7
            }
          }
        }], block, options))
        throw new Error('No error was thrown')
      } catch (err: any) {
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
          secs: 10n
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
          secs: 10n
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

      function eachFile (file: { path?: string, cid: string, unixfs?: UnixFS }): void {
        if (file.unixfs == null) {
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

    it('will call an optional onProgress function', async () => {
      const chunkSize = 2048
      const path = '1.2MiB.txt'
      const onProgress = sinon.stub()

      const options: Partial<ImporterOptions> = {
        onProgress,
        chunker: fixedSize({
          chunkSize
        })
      }

      await all(importer([{
        path,
        content: asAsyncIterable(bigFile)
      }], block, options))

      expect(onProgress.called).to.equal(true)
      expect(onProgress.getCall(0).args[0]).to.have.property('type', 'unixfs:importer:progress:file:read')
      expect(onProgress.getCall(0).args[0]).to.have.deep.property('detail', { bytesRead: BigInt(chunkSize), chunkSize: BigInt(chunkSize), path })
    })

    it('will import files with CID version 1', async () => {
      const createInputFile = (path: string, size: number): { path: string, content: Uint8Array } => {
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

      const options: Partial<ImporterOptions> = {
        cidVersion: 1,
        // Ensures we use DirSharded for the data below
        shardSplitThresholdBytes: 3,
        rawLeaves: false
      }

      const files = await all(importer(inputFiles.map(file => ({
        ...file,
        content: asAsyncIterable(file.content)
      })), block, options))

      const file = files[0]
      expect(file).to.exist()

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (file.unixfs?.isDirectory() === true) {
          // ignore directories
          continue
        }

        const cid = file.cid.toV1()
        const inputFile = inputFiles.find(f => f.path === file.path)

        if (inputFile == null) {
          throw new Error(`Could not find input file with path ${file.path}`)
        }

        // Check the imported content is correct
        const node = await exporter(cid, block)

        if (node.type !== 'file') {
          throw new Error('Unexpected type')
        }

        expect(uint8ArrayConcat(await all(node.content()))).to.deep.equal(inputFile.content)
      }
    })

    it('imports file with raw leaf nodes when specified', async () => {
      await checkLeafNodeTypes(block, {
        leafType: 'raw',
        rawLeaves: false
      }, 'raw')
    })

    it('imports file with file leaf nodes when specified', async () => {
      await checkLeafNodeTypes(block, {
        leafType: 'file',
        rawLeaves: false
      }, 'file')
    })

    it('reduces file to single node when specified', async () => {
      await checkNodeLinks(block, {
        reduceSingleLeafToSelf: true,
        rawLeaves: false
      }, 0)
    })

    it('does not reduce file to single node when overidden by options', async () => {
      await checkNodeLinks(block, {
        reduceSingleLeafToSelf: false,
        rawLeaves: false
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
        mtime: dateToTimespec(now)
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
        mtime: dateToTimespec(now)
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
        mtime: dateToTimespec(now),
        mode: perms
      }, {
        path: '/foo/bar.txt',
        content: asAsyncIterable(bigFile)
      }], block))

      const nodes = await all(recursive(entries[entries.length - 1].cid, block))
      const node = await last(filter(map(nodes, async (node) => exporter(node.cid, block)), node => node.type === 'directory'))

      if (node == null) {
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
        mtime: dateToTimespec(now),
        mode: perms
      }, {
        path: '/foo/bar/baz.txt',
        content: asAsyncIterable(bigFile)
      }], block))

      const nodes = await all(recursive(entries[entries.length - 1].cid, block))
      const node = await last(filter(map(nodes, async (node) => exporter(node.cid, block)), node => node.type === 'directory'))

      if (node == null) {
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
        mtime: dateToTimespec(now),
        mode: perms
      }, {
        path: '/foo/quux'
      }, {
        path: '/foo/bar/baz.txt',
        content: asAsyncIterable(bigFile)
      }], block))

      const nodes = await all(recursive(entries[entries.length - 1].cid, block))
      const node = await last(filter(map(filter(nodes, (node) => node.name === 'bar'), async (node) => exporter(node.cid, block)), node => node.type === 'directory'))

      if (node == null) {
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
        mtime: dateToTimespec(now)
      }, {
        path: '/foo/bar.txt',
        content: asAsyncIterable(bigFile)
      }, {
        path: '/foo/baz.txt',
        content: asAsyncIterable(bigFile)
      }, {
        path: '/foo/qux'
      }], block, {
        shardSplitThresholdBytes: 0
      }))

      const nodes = await all(recursive(entries[entries.length - 1].cid, block))
      const node = await last(filter(map(nodes, async (node) => exporter(node.cid, block)), node => node.type === 'directory' && node.unixfs.type === 'hamt-sharded-directory'))

      if (node == null) {
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
        mode
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

    it('should only add metadata to the root node of a file', async () => {
      this.timeout(60 * 1000)

      const mtime = { secs: 5000n, nsecs: 0 }

      const entries = await all(importer([{
        path: '/foo/file1.txt',
        content: asAsyncIterable(bigFile),
        mtime
      }], block, {
        rawLeaves: false
      }))

      const root = await exporter(entries[0].cid, block)
      expect(root).to.have.deep.nested.property('unixfs.mtime', mtime)

      if (root.node instanceof Uint8Array) {
        throw new Error('Root node was not large enough to have children')
      }

      const child = await exporter(root.node.Links[0].Hash, block)

      if (child.type !== 'file') {
        throw new Error('Child node was wrong type')
      }

      expect(child).to.have.property('unixfs')
      expect(child).to.have.nested.property('unixfs.mtime', undefined)
    })

    it('should add metadata to the root node of a small file without raw leaves', async () => {
      this.timeout(60 * 1000)

      const mode = 511

      const entries = await all(importer([{
        path: '/foo/file1.txt',
        content: asAsyncIterable(smallFile),
        mode
      }], block, {
        rawLeaves: false
      }))

      const root = await exporter(entries[0].cid, block)

      expect(root).to.have.nested.property('unixfs.mode', 511)
    })
  })
})

describe('configuration', () => {
  const block = new MemoryBlockstore()

  it('alllows configuring with custom dag and tree builder', async () => {
    let builtTree = false
    const cid = CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
    const unixfs = new UnixFS({ type: 'directory' })

    // @ts-expect-error custom dag builder expects weird data
    const entries = await all(importer([{
      path: 'path',
      content: 'content'
    }], block, {
      /** @type {import('ipfs-unixfs-importer').DAGBuilder} */
      dagBuilder: async function * (source, block) {
        yield async function () {
          return Promise.resolve({
            cid,
            path: 'path',
            unixfs,
            size: 0
          })
        }
      },
      /** @type {import('ipfs-unixfs-importer').TreeBuilder} */
      treeBuilder: async function * (source, block) {
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
      chunkValidator: async function * (source) {
        validated = true

        for await (const str of source) {
          if (typeof str === 'string') {
            yield uint8ArrayFromString(str)
          } else {
            yield Uint8Array.from(str)
          }
        }
      },
      chunker: async function * (source) {
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

    if (result == null) {
      throw new Error('Nothing imported')
    }

    const { cid: cidV0 } = result

    const result2 = await last(importer([{
      content: asAsyncIterable(buf)
    }], block, {
      cidVersion: 1,
      rawLeaves: false
    }))

    if (result2 == null) {
      throw new Error('Nothing imported')
    }

    const { cid: cidV1 } = result2

    expect(cidV0.multihash).to.deep.equal(cidV1.multihash)
  })
})
