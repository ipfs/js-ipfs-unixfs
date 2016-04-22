/* eslint-env mocha */
'use strict'

const unixFSEngine = require('./../src')
const importer = unixFSEngine.importer
const exporter = unixFSEngine.exporter
const BlockService = require('ipfs-blocks').BlockService
const DAGService = require('ipfs-merkle-dag').DAGService
const DAGNode = require('ipfs-merkle-dag').DAGNode
const UnixFS = require('ipfs-unixfs')
const streamifier = require('streamifier')

const expect = require('chai').expect

const smallBuf = require('buffer!./test-data/200Bytes.txt')
const bigBuf = require('buffer!./test-data/1.2MiB.txt')
const bigBlock = require('buffer!./test-data/1.2MiB.txt.block')
const bigLink = require('buffer!./test-data/1.2MiB.txt.link-block0')
const marbuf = require('buffer!./test-data/200Bytes.txt.block')

module.exports = function (repo) {
  describe('layout: importer', function () {
    it('import a small buffer', function (done) {
      // this is just like "import a small file"
      const r = streamifier.createReadStream(smallBuf)
        const i = new Importer(ds)
        i.on('file', (file) => {
          expect(file.path).to.equal('200Bytes.txt')
          expect(bs58.encode(file.multihash)).to.equal('QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8')
          expect(file.size).to.equal(211)
          done()
        })
        i.add({path: '200Bytes.txt', stream: r})
        i.finish()
      })

    /*it('import a big buffer', function (done) {
      // this is just like "import a big file"
      const buf = bigBuf
      const bs = new BlockService(repo)
      const ds = new DAGService(bs)
      importer.import(buf, ds, function (err, stat) {
        expect(err).to.not.exist
        ds.get(stat.Hash, function (err, node) {
          expect(err).to.not.exist
          const bigDAGNode = new DAGNode()
          bigDAGNode.unMarshal(bigBlock)
          expect(node.size()).to.equal(bigDAGNode.size())
          expect(node.links).to.deep.equal(bigDAGNode.links)

          const nodeUnixFS = UnixFS.unmarshal(node.data)
          const bigDAGNodeUnixFS = UnixFS.unmarshal(bigDAGNode.data)
          expect(nodeUnixFS.type).to.equal(bigDAGNodeUnixFS.type)
          expect(nodeUnixFS.data).to.deep.equal(bigDAGNodeUnixFS.data)
          expect(nodeUnixFS.blockSizes).to.deep.equal(bigDAGNodeUnixFS.blockSizes)
          expect(nodeUnixFS.fileSize()).to.equal(bigDAGNodeUnixFS.fileSize())

          expect(node.data).to.deep.equal(bigDAGNode.data)
          expect(node.multihash()).to.deep.equal(bigDAGNode.multihash())

          ds.get(node.links[0].hash, function (err, node) {
            expect(err).to.not.exist
            const leaf = new DAGNode()

            const marbuf2 = bigLink
            leaf.unMarshal(marbuf2)
            expect(node.links).to.deep.equal(leaf.links)
            expect(node.links.length).to.equal(0)
            expect(leaf.links.length).to.equal(0)
            expect(leaf.marshal()).to.deep.equal(marbuf2)
            const nodeUnixFS = UnixFS.unmarshal(node.data)
            const leafUnixFS = UnixFS.unmarshal(leaf.data)
            expect(nodeUnixFS.type).to.equal(leafUnixFS.type)
            expect(nodeUnixFS.fileSize()).to.equal(leafUnixFS.fileSize())
            expect(nodeUnixFS.data).to.deep.equal(leafUnixFS.data)
            expect(nodeUnixFS.blockSizes).to.deep.equal(leafUnixFS.blockSizes)
            expect(node.data).to.deep.equal(leaf.data)
            expect(node.marshal()).to.deep.equal(leaf.marshal())
            done()
          })
        })
      })
    })*/

    it('export a file with no links', (done) => {
      const hash = 'QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8'
      const bs = new BlockService(repo)
      const ds = new DAGService(bs)
      const testExport = exporter(hash, ds)
      testExport.on('file', (data) => {
        ds.get(hash, (err, fetchedNode) => {
          expect(err).to.not.exist
          const unmarsh = UnixFS.unmarshal(fetchedNode.data)
          expect(unmarsh.data).to.deep.equal(data.stream._readableState.buffer[0])
          done()
        })
      })
    })

    it('export a small file with links', (done) => {
      const hash = 'QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q'
      const bs = new BlockService(repo)
      const ds = new DAGService(bs)
      const testExport = exporter(hash, ds)
      testExport.on('file', (data) => {
        expect(data.stream).to.exist
        done()
      })
    })

    it('export a large file > 5mb', (done) => {
      const hash = 'QmRQgufjp9vLE8XK2LGKZSsPCFCF6e4iynCQtNB5X2HBKE'
      const bs = new BlockService(repo)
      const ds = new DAGService(bs)
      const testExport = exporter(hash, ds)
      testExport.on('file', (data) => {
        expect(data.stream).to.exist
        done()
      })
    })

    it('export a directory', (done) => {
      const hash = 'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN'
      const bs = new BlockService(repo)
      const ds = new DAGService(bs)
      const testExport = exporter(hash, ds)
      var fs = []
      testExport.on('file', (data) => {
        fs.push(data)
      })
      setTimeout(() => {
        expect(fs[0].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/200Bytes.txt')
        expect(fs[1].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/dir-another')
        expect(fs[2].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1/200Bytes.txt')
        expect(fs[3].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1/level-2')
        done()
      }, 1000)
    })
  })
}
