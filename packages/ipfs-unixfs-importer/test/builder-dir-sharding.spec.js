/* eslint-env mocha */
'use strict'

const { Buffer } = require('buffer')
const importer = require('../src')
const exporter = require('ipfs-unixfs-exporter')

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const all = require('it-all')
const last = require('it-last')
const blockApi = require('./helpers/block')

describe('builder: directory sharding', () => {
  let ipld
  let block

  before(async () => {
    ipld = await inMemory(IPLD)
    block = blockApi(ipld)
  })

  describe('basic dirbuilder', () => {
    it('yields a non-sharded dir', async () => {
      const content = Buffer.from('i have the best bytes')
      const nodes = await all(importer([{
        path: 'a/b',
        content
      }], block, {
        shardSplitThreshold: Infinity // never shard
      }))

      expect(nodes.length).to.equal(2)

      expect(nodes[0].path).to.equal('a/b')
      expect(nodes[1].path).to.equal('a')

      const dirNode = await exporter(nodes[1].cid, ipld)
      expect(dirNode.unixfs.type).to.equal('directory')

      const fileNode = await exporter(nodes[0].cid, ipld)
      expect(fileNode.unixfs.type).to.equal('file')
      expect(Buffer.concat(await all(fileNode.content()))).to.deep.equal(content)
    })

    it('yields a sharded dir', async () => {
      const nodes = await all(importer([{
        path: 'a/b',
        content: Buffer.from('i have the best bytes')
      }], block, {
        shardSplitThreshold: 0 // always shard
      }))

      expect(nodes.length).to.equal(2)
      expect(nodes[0].path).to.equal('a/b')
      expect(nodes[1].path).to.equal('a')

      const node = await exporter(nodes[1].cid, ipld)

      expect(node.unixfs.type).to.equal('hamt-sharded-directory')
    })

    it('exporting unsharded hash results in the correct files', async () => {
      const content = 'i have the best bytes'
      const nodes = await all(importer([{
        path: 'a/b',
        content: Buffer.from(content)
      }], block, {
        shardSplitThreshold: Infinity // never shard
      }))

      const nonShardedHash = nodes[1].cid

      const dir = await exporter(nonShardedHash, ipld)
      const files = await all(dir.content())

      expect(files.length).to.equal(1)

      const expectedHash = nonShardedHash.toBaseEncodedString()

      expect(dir.path).to.be.eql(expectedHash)
      expect(dir.cid.toBaseEncodedString()).to.be.eql(expectedHash)
      expect(files[0].path).to.be.eql(expectedHash + '/b')
      expect(files[0].unixfs.fileSize()).to.be.eql(content.length)

      const fileContent = Buffer.concat(await all(files[0].content()))

      expect(fileContent.toString()).to.equal(content)
    })

    it('exporting sharded hash results in the correct files', async () => {
      const content = 'i have the best bytes'
      const nodes = await all(importer([{
        path: 'a/b',
        content: Buffer.from(content)
      }], block, {
        shardSplitThreshold: 0 // always shard
      }))

      const shardedHash = nodes[1].cid

      const dir = await exporter(shardedHash, ipld)
      const files = await all(dir.content())

      expect(files.length).to.equal(1)

      const expectedHash = shardedHash.toBaseEncodedString()

      expect(dir.path).to.be.eql(expectedHash)
      expect(dir.cid.toBaseEncodedString()).to.be.eql(expectedHash)
      expect(files[0].path).to.be.eql(expectedHash + '/b')
      expect(files[0].unixfs.fileSize()).to.be.eql(content.length)

      const fileContent = Buffer.concat(await all(files[0].content()))

      expect(fileContent.toString()).to.equal(content)
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
              content: Buffer.from(i.toString())
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
              content: Buffer.from(i.toString())
            }
          }
        }
      }

      const nodes = await all(importer(source, block))

      expect(nodes.length).to.equal(maxDirs + 1) // files plus the containing directory

      const dir = await exporter(nodes[nodes.length - 1].cid, ipld)

      for await (const entry of dir.content()) {
        const content = Buffer.concat(await all(entry.content()))
        expect(content.toString()).to.equal(parseInt(entry.name, 10).toString())
      }
    })
  })

  describe('big nested dir', function () {
    this.timeout(450 * 1000)

    const maxDirs = 2000
    const maxDepth = 3
    let rootHash

    before(async () => {
      const source = {
        [Symbol.iterator]: function * () {
          let pending = maxDirs
          let pendingDepth = maxDepth
          let i = 0
          let depth = 1

          while (pendingDepth && pending) {
            i++
            const dir = []

            for (let d = 0; d < depth; d++) {
              dir.push('big')
            }

            yield {
              path: dir.concat(i.toString().padStart(4, '0')).join('/'),
              content: Buffer.from(i.toString())
            }

            pending--
            if (!pending) {
              pendingDepth--
              pending = maxDirs
              i = 0
              depth++
            }
          }
        }
      }

      const node = await last(importer(source, block))
      expect(node.path).to.equal('big')

      rootHash = node.cid
    })

    it('imports a big dir', async () => {
      const dir = await exporter(rootHash, ipld)

      const verifyContent = async (node) => {
        if (node.unixfs.type === 'file') {
          const bufs = await all(node.content())
          const content = Buffer.concat(bufs)
          expect(content.toString()).to.equal(parseInt(node.name, 10).toString())
        } else {
          for await (const entry of node.content()) {
            await verifyContent(entry)
          }
        }
      }

      await verifyContent(dir)
    })

    it('exports a big dir', async () => {
      const collectContent = async (node, entries = {}) => {
        if (node.unixfs.type === 'file') {
          entries[node.path] = {
            content: Buffer.concat(await all(node.content())).toString()
          }
        } else {
          entries[node.path] = node

          for await (const entry of node.content()) {
            await collectContent(entry, entries)
          }
        }

        return entries
      }

      const eachPath = (path) => {
        if (!index) {
          // first dir
          if (depth === 1) {
            expect(path).to.equal(dir.cid.toBaseEncodedString())
          }

          const entry = entries[path]
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

      const dir = await exporter(rootHash, ipld)

      const entries = await collectContent(dir)
      let index = 0
      let depth = 1

      const paths = Object.keys(entries).sort()
      expect(paths.length).to.equal(maxDepth * maxDirs + maxDepth)
      paths.forEach(eachPath)
    })

    it('exports a big dir with subpath', async () => {
      const exportHash = rootHash.toBaseEncodedString() + '/big/big/2000'

      const node = await exporter(exportHash, ipld)
      expect(node.path).to.equal(exportHash)

      const content = Buffer.concat(await all(node.content()))
      expect(content.toString()).to.equal('2000')
    })
  })
})
