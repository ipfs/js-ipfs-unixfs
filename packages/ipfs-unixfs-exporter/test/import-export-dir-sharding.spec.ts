/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import { importer } from 'ipfs-unixfs-importer'
import all from 'it-all'
import last from 'it-last'
import toBuffer from 'it-to-buffer'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { exporter, walkPath } from '../src/index.js'
import asAsyncIterable from './helpers/as-async-iterable.ts'
import type { UnixFSDirectory, UnixFSDirectoryEntry, UnixFSEntry } from '../src/index.js'
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

      const files = await all(dir.entries())
      expect(files.length).to.equal(1)
      expect(files[0].name).to.equal('b')

      const file = await exporter(files[0].cid, block)

      if (file.type !== 'file') {
        throw new Error('Unexpected type')
      }

      expect(dir.cid).to.equal(nonShardedHash)
      expect(file.unixfs.fileSize()).to.equal(BigInt(content.length))

      const fileContent = uint8ArrayConcat(await all(file.content()))

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

      const files = await all(dir.entries())
      expect(files.length).to.equal(1)

      const file = await exporter(files[0].cid, block)

      if (file.type !== 'file') {
        throw new Error('Unexpected type')
      }

      expect(dir.cid).to.equal(shardedHash)
      expect(files[0].name).to.equal('b')
      expect(file.unixfs.fileSize()).to.equal(BigInt(content.length))

      const fileContent = uint8ArrayConcat(await all(file.content()))

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

      for await (const entry of dir.entries()) {
        const file = await exporter(entry.cid, block)

        if (file.type !== 'file') {
          throw new Error('Unexpected type')
        }

        const content = uint8ArrayConcat(await all(file.content()))
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
      const verifyContent = async (node: UnixFSDirectoryEntry): Promise<void> => {
        const file = await exporter(node.cid, block)

        if (file.type === 'file') {
          const bufs = await all(file.content())
          const content = uint8ArrayConcat(bufs)
          expect(uint8ArrayToString(content)).to.equal(parseInt(node.name ?? '', 10).toString())
        } else if (file.type === 'directory') {
          for await (const entry of file.entries()) {
            await verifyContent(entry)
          }
        }
      }

      await verifyContent({
        cid: rootHash,
        name: '',
        path: ''
      })
    })

    it('exports a big dir', async () => {
      const collectContent = async (path: string, node: UnixFSEntry, entries: Record<string, ({ type: 'file', content: string } | UnixFSDirectory)> = {}): Promise<Record<string, UnixFSDirectory | { type: 'file', content: string }>> => {
        if (node.type === 'file' || node.type === 'raw') {
          entries[path] = {
            type: 'file',
            content: uint8ArrayToString(await toBuffer(node.content()))
          }
        } else if (node.type === 'directory') {
          entries[path] = node

          for await (const entry of node.entries()) {
            const file = await exporter(entry.cid, block)
            await collectContent(`${path}/${entry.name}`, file, entries)
          }
        } else {
          throw new Error(`Unexpected type ${node.type}`)
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
          expect(entry).to.have.property('entries').that.is.not.a('string')
        } else {
          // dir entries
          const pathElements = path.split('/')
          expect(pathElements.length).to.equal(depth + 1)
          const lastElement = pathElements[pathElements.length - 1]
          expect(lastElement).to.equal(index.toString().padStart(4, '0'))
          expect(entries[path]).to.have.property('content', index.toString())
        }
        index++
        if (index > maxDirs) {
          index = 0
          depth++
        }
      }

      const dir = await exporter(rootHash, block)
      const entries = await collectContent(dir.cid.toString(), dir)
      let index = 0
      let depth = 1

      const paths = Object.keys(entries).sort()
      expect(paths.length).to.equal(maxDepth * maxDirs + maxDepth)
      paths.forEach(eachPath)
    })

    it('exports a big dir with subpath', async () => {
      const entry = await last(walkPath(`${rootHash}/big/big/2000`, block))

      if (entry == null) {
        throw new Error('Did not walk path')
      }

      const node = await exporter(entry.cid, block)

      if (node.type !== 'file') {
        throw new Error('Expected file')
      }

      const content = uint8ArrayConcat(await all(node.content()))
      expect(uint8ArrayToString(content)).to.equal('2000')
    })
  })
})
