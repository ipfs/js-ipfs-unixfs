/* eslint-env mocha */
const importer = require('./../src')
const BlockService = require('ipfs-blocks').BlockService
const DAGService = require('ipfs-merkle-dag').DAGService
const DAGNode = require('ipfs-merkle-dag').DAGNode
const UnixFS = require('ipfs-unixfs')

const FixedSizeChunker = require('./../src/chunker-fixed-size')
const expect = require('chai').expect
const stringToStream = require('string-to-stream')
const through = require('through2')

const myFile = require('buffer!./test-data/1.2MiB.txt')
const fileStream = function () {
  return stringToStream(myFile)
}

const smallBuf = require('buffer!./test-data/200Bytes.txt')
const bigBuf = require('buffer!./test-data/1.2MiB.txt')
const bigBlock = require('buffer!./test-data/1.2MiB.txt.block')
const bigLink = require('buffer!./test-data/1.2MiB.txt.link-block0')
const marbuf = require('buffer!./test-data/200Bytes.txt.block')

module.exports = function (repo) {
  describe('chunker: fixed size', function () {
    this.timeout(10000)

    it('256 Bytes chunks', function (done) {
      var counter = 0
      fileStream()
        .pipe(FixedSizeChunker(256))
        .pipe(through(function (chunk, enc, cb) {
          if (chunk.length < 256) {
            expect(counter).to.be.below(1)
            counter += 1
            return cb()
          }
          expect(chunk.length).to.equal(256)
          cb()
        }, () => {
          done()
        }))
    })

    it('256 KiB chunks', function (done) {
      var counter = 0
      var KiB256 = 262144
      fileStream()
        .pipe(FixedSizeChunker(KiB256))
        .pipe(through((chunk, enc, cb) => {
          if (chunk.length < 262144) {
            expect(counter).to.be.below(1)
            counter += 1
            return cb()
          }
          expect(chunk.length).to.equal(262144)
          cb()
        }, () => {
          done()
        }))
    })

    it('256 KiB chunks of non scalar filesize', function (done) {
      var counter = 0
      var KiB256 = 262144
      fileStream()
        .pipe(FixedSizeChunker(KiB256))
        .pipe(through((chunk, enc, cb) => {
          if (chunk.length < KiB256) {
            expect(counter).to.be.below(2)
            counter += 1
            return cb()
          }
          expect(chunk.length).to.equal(KiB256)
          cb()
        }, () => {
          done()
        }))
    })
  })

  describe('layout: importer', function () {
    it('import a small buffer', function (done) {
      // this is just like "import a small file"
      var bs = new BlockService(repo)
      var ds = new DAGService(bs)
      var buf = smallBuf
      importer.import(buf, ds, function (err, stat) {
        expect(err).to.not.exist
        ds.get(stat.Hash, function (err, node) {
          expect(err).to.not.exist
          const smallDAGNode = new DAGNode()
          smallDAGNode.unMarshal(marbuf)
          expect(node.size()).to.equal(smallDAGNode.size())
          expect(node.multihash()).to.deep.equal(smallDAGNode.multihash())
          done()
        })
      })
    })

    it('import a big buffer', function (done) {
      // this is just like "import a big file"
      var buf = bigBuf
      var bs = new BlockService(repo)
      var ds = new DAGService(bs)
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

            var marbuf2 = bigLink
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
    })
  })
}
