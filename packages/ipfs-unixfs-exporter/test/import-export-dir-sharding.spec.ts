/* eslint-env mocha */

import { importer } from 'ipfs-unixfs-importer'
import { exporter, UnixFSDirectory, UnixFSEntry } from '../src/index.js'
import { expect } from 'aegir/chai'
import all from 'it-all'
import last from 'it-last'
import { MemoryBlockstore } from 'blockstore-core'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import asAsyncIterable from './helpers/as-async-iterable.js'
import type { CID } from 'multiformats/cid'

describe('builder: directory sharding', () => {
  const block = new MemoryBlockstore()

  describe('basic dirbuilder', () => {
    it('yields a non-sharded dir', async () => {
      const content = uint8ArrayFromString('i have the best bytes')
      const nodes = await all(importer([{
        path: 'a/b',
        content: asAsyncIterable(content)
      }], block, {
        shardSplitThresholdBytes: Infinity, // never shard
        rawLeaves: false,
        cidVersion: 0
      }))

      expect(nodes.length).to.equal(2)

      expect(nodes[0].path).to.equal('a/b')
      expect(nodes[1].path).to.equal('a')

      const dirNode = await exporter(nodes[1].cid, block)

      if (dirNode.type !== 'directory') {
        throw new Error('Unexpected type')
      }

      expect(dirNode.unixfs.type).to.equal('directory')

      const fileNode = await exporter(nodes[0].cid, block)

      if (fileNode.type !== 'file') {
        throw new Error('Unexpected type')
      }

      expect(fileNode.unixfs.type).to.equal('file')

      if (fileNode.type !== 'file') {
        throw new Error('Unexpected type')
      }

      expect(uint8ArrayConcat(await all(fileNode.content()))).to.deep.equal(content)
    })

    it('yields a sharded dir', async () => {
      const nodes = await all(importer([{
        path: 'a/b',
        content: asAsyncIterable(uint8ArrayFromString('i have the best bytes'))
      }], block, {
        shardSplitThresholdBytes: 0 // always shard
      }))

      expect(nodes.length).to.equal(2)
      expect(nodes[0].path).to.equal('a/b')
      expect(nodes[1].path).to.equal('a')

      const node = await exporter(nodes[1].cid, block)

      if (node.type !== 'directory') {
        throw new Error('Unexpected type')
      }

      expect(node.unixfs.type).to.equal('hamt-sharded-directory')
    })

    it('exporting unsharded hash results in the correct files', async () => {
      const content = 'i have the best bytes'
      const nodes = await all(importer([{
        path: 'a/b',
        content: asAsyncIterable(uint8ArrayFromString(content))
      }], block, {
        shardSplitThresholdBytes: Infinity, // never shard
        rawLeaves: false,
        cidVersion: 0
      }))

      const nonShardedHash = nodes[1].cid

      const dir = await exporter(nonShardedHash, block)

      if (dir.type !== 'directory') {
        throw new Error('Unexpected type')
      }

      const files = await all(dir.content())

      expect(files.length).to.equal(1)

      if (files[0].type !== 'file') {
        throw new Error('Unexpected type')
      }

      const expectedHash = nonShardedHash.toString()

      expect(dir.path).to.be.eql(expectedHash)
      expect(dir.cid.toString()).to.be.eql(expectedHash)
      expect(files[0].path).to.be.eql(expectedHash + '/b')
      expect(files[0].unixfs.fileSize()).to.be.eql(BigInt(content.length))

      const fileContent = uint8ArrayConcat(await all(files[0].content()))

      expect(uint8ArrayToString(fileContent)).to.equal(content)
    })

    it('exporting sharded hash results in the correct files', async () => {
      const content = 'i have the best bytes'
      const nodes = await all(importer([{
        path: 'a/b',
        content: asAsyncIterable(uint8ArrayFromString(content))
      }], block, {
        shardSplitThresholdBytes: 0, // always shard
        rawLeaves: false,
        cidVersion: 0
      }))

      const shardedHash = nodes[1].cid

      const dir = await exporter(shardedHash, block)

      if (dir.type !== 'directory') {
        throw new Error('Unexpected type')
      }

      const files = await all(dir.content())

      expect(files.length).to.equal(1)

      if (files[0].type !== 'file') {
        throw new Error('Unexpected type')
      }

      const expectedHash = shardedHash.toString()

      expect(dir.path).to.equal(expectedHash)
      expect(dir.cid.toString()).to.equal(expectedHash)
      expect(files[0].path).to.be.eql(expectedHash + '/b')
      expect(files[0].unixfs.fileSize()).to.equal(BigInt(content.length))

      const fileContent = uint8ArrayConcat(await all(files[0].content()))

      expect(uint8ArrayToString(fileContent)).to.equal(content)
    })
  })

  describe('big dir', function () {
    this.timeout(30 * 1000)

    const maxDirs = 2000

    it('imports a big dir', async () => {
      const source = {
        [Symbol.iterator]: function * () {
          for (let i = 0; i < maxDirs; i++) {
            yield {
              path: 'big/' + i.toString().padStart(4, '0'),
              content: asAsyncIterable(uint8ArrayFromString(i.toString()))
            }
          }
        }
      }

      const nodes = await all(importer(source, block))

      expect(nodes.length).to.equal(maxDirs + 1)
      const last = nodes[nodes.length - 1]
      expect(last.path).to.equal('big')
    })

    it('exports a big dir', async () => {
      const source = {
        [Symbol.iterator]: function * () {
          for (let i = 0; i < maxDirs; i++) {
            yield {
              path: 'big/' + i.toString().padStart(4, '0'),
              content: asAsyncIterable(uint8ArrayFromString(i.toString()))
            }
          }
        }
      }

      const nodes = await all(importer(source, block, {
        rawLeaves: false,
        cidVersion: 0
      }))

      expect(nodes.length).to.equal(maxDirs + 1) // files plus the containing directory

      const dir = await exporter(nodes[nodes.length - 1].cid, block)

      if (dir.type !== 'directory') {
        throw new Error('Unexpected type')
      }

      for await (const entry of dir.content()) {
        if (entry.type !== 'file') {
          throw new Error('Unexpected type')
        }

        const content = uint8ArrayConcat(await all(entry.content()))
        expect(uint8ArrayToString(content)).to.equal(parseInt(entry.name, 10).toString())
      }
    })
  })

  describe('big nested dir', function () {
    this.timeout(450 * 1000)

    const maxDirs = 2000
    const maxDepth = 3
    let rootHash: CID

    before(async () => {
      const source = {
        [Symbol.iterator]: function * () {
          let pending = maxDirs
          let pendingDepth = maxDepth
          let i = 0
          let depth = 1

          while (pendingDepth > 0 && pending > 0) {
            i++
            const dir = []

            for (let d = 0; d < depth; d++) {
              dir.push('big')
            }

            yield {
              path: dir.concat(i.toString().padStart(4, '0')).join('/'),
              content: asAsyncIterable(uint8ArrayFromString(i.toString()))
            }

            pending--
            if (pending === 0) {
              pendingDepth--
              pending = maxDirs
              i = 0
              depth++
            }
          }
        }
      }

      const node = await last(importer(source, block, {
        rawLeaves: false,
        cidVersion: 0
      }))

      if (node == null) {
        throw new Error('Nothing imported')
      }

      expect(node.path).to.equal('big')

      rootHash = node.cid
    })

    it('imports a big dir', async () => {
      const dir = await exporter(rootHash, block)

      const verifyContent = async (node: UnixFSEntry): Promise<void> => {
        if (node.type === 'file') {
          const bufs = await all(node.content())
          const content = uint8ArrayConcat(bufs)
          expect(uint8ArrayToString(content)).to.equal(parseInt(node.name ?? '', 10).toString())
        } else if (node.type === 'directory') {
          for await (const entry of node.content()) {
            await verifyContent(entry)
          }
        }
      }

      await verifyContent(dir)
    })

    it('exports a big dir', async () => {
      const collectContent = async (node: UnixFSEntry, entries: Record<string, ({ type: 'file', content: string } | UnixFSDirectory)> = {}): Promise<Record<string, UnixFSDirectory | { type: 'file', content: string }>> => {
        if (node.type === 'file') {
          entries[node.path] = {
            type: 'file',
            content: uint8ArrayToString(uint8ArrayConcat(await all(node.content())))
          }
        } else if (node.type === 'directory') {
          entries[node.path] = node

          for await (const entry of node.content()) {
            await collectContent(entry, entries)
          }
        }

        return entries
      }

      const eachPath = (path: string): void => {
        if (index === 0) {
          // first dir
          if (depth === 1) {
            expect(path).to.equal(dir.cid.toString())
          }

          const entry = entries[path]

          if (entry.type === 'file') {
            throw new Error('Unexpected type')
          }

          expect(entry).to.exist()
          expect(entry.content).to.not.be.a('string')
        } else {
          // dir entries
          const pathElements = path.split('/')
          expect(pathElements.length).to.equal(depth + 1)
          const lastElement = pathElements[pathElements.length - 1]
          expect(lastElement).to.equal(index.toString().padStart(4, '0'))
          expect(entries[path].content).to.equal(index.toString())
        }
        index++
        if (index > maxDirs) {
          index = 0
          depth++
        }
      }

      const dir = await exporter(rootHash, block)

      const entries = await collectContent(dir)
      let index = 0
      let depth = 1

      const paths = Object.keys(entries).sort()
      expect(paths.length).to.equal(maxDepth * maxDirs + maxDepth)
      paths.forEach(eachPath)
    })

    it('exports a big dir with subpath', async () => {
      const exportHash = rootHash.toString() + '/big/big/2000'

      const node = await exporter(exportHash, block)
      expect(node.path).to.equal(exportHash)

      if (node.type !== 'file') {
        throw new Error('Unexpected type')
      }

      const content = uint8ArrayConcat(await all(node.content()))
      expect(uint8ArrayToString(content)).to.equal('2000')
    })
  })
})
