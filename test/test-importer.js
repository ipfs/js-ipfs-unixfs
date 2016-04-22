/* eslint-env mocha */
'use strict'

const Importer = require('./../src').importer
const expect = require('chai').expect
const BlockService = require('ipfs-blocks').BlockService
const DAGService = require('ipfs-merkle-dag').DAGService
// const DAGNode = require('ipfs-merkle-dag').DAGNode
const bs58 = require('bs58')
const fs = require('fs')
// const UnixFS = require('ipfs-unixfs')
const path = require('path')
const streamifier = require('streamifier')

let ds

module.exports = function (repo) {
  describe('importer', function () {
    const bigFile = fs.readFileSync(path.join(__dirname, '/test-data/1.2MiB.txt'))
    const smallFile = fs.readFileSync(path.join(__dirname, '/test-data/200Bytes.txt'))

    // const dirSmall = path.join(__dirname, '/test-data/dir-small')
    // const dirBig = path.join(__dirname, '/test-data/dir-big')
    // const dirNested = path.join(__dirname, '/test-data/dir-nested')

    before((done) => {
      const bs = new BlockService(repo)
      expect(bs).to.exist
      ds = new DAGService(bs)
      expect(ds).to.exist
      done()
    })

    it('small file (smaller than a chunk)', (done) => {
      const buffered = smallFile
      const r = streamifier.createReadStream(buffered)
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

    it('small file (smaller than a chunk) inside a dir', (done) => {
      const buffered = smallFile
      const r = streamifier.createReadStream(buffered)
      const i = new Importer(ds)
      var counter = 0
      i.on('file', (file) => {
        counter++
        if (file.path === 'foo/bar/200Bytes.txt') {
          expect(bs58.encode(file.multihash).toString())
            .to.equal('QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8')
        }
        if (file.path === 'foo/bar') {
          expect(bs58.encode(file.multihash).toString())
            .to.equal('Qmf5BQbTUyUAvd6Ewct83GYGnE1F6btiC3acLhR8MDxgkD')
        }
        if (file.path === 'foo') {
          expect(bs58.encode(file.multihash).toString())
            .to.equal('QmQrb6KKWGo8w7zKfx2JksptY6wN7B2ysSBdKZr4xMU36d')
        }
        if (counter === 3) {
          done()
        }
      })
      i.on('err', (err) => {
        expect(err).to.not.exist
      })
      i.add({path: 'foo/bar/200Bytes.txt', stream: r})
      i.finish()
    })

    it('file bigger than a single chunk', (done) => {
      const buffered = bigFile
      const r = streamifier.createReadStream(buffered)
      const i = new Importer(ds)
      i.on('file', (file) => {
        expect(file.path).to.equal('1.2MiB.txt')
        expect(bs58.encode(file.multihash)).to.equal('QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q')
        expect(file.size).to.equal(1258318)
        done()
      })
      i.add({path: '1.2MiB.txt', stream: r})
      i.finish()
    })

    it('file bigger than a single chunk inside a dir', (done) => {
      const buffered = bigFile
      const r = streamifier.createReadStream(buffered)
      const i = new Importer(ds)
      var counter = 0
      i.on('file', (file) => {
        counter++
        if (file.path === 'foo-big/1.2Mib.txt') {
          expect(bs58.encode(file.multihash)).to.equal('QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q')
          expect(file.size).to.equal(1258318)
        }
        if (file.path === 'foo-big') {
          expect(bs58.encode(file.multihash)).to.equal('QmaFgyFJUP4fxFySJCddg2Pj6rpwSywopWk87VEVv52RSj')
          expect(file.size).to.equal(1258376)
        }
        if (counter === 2) {
          done()
        }
      })
      i.add({path: 'foo-big/1.2MiB.txt', stream: r})
      i.finish()
    })

    it.skip('file (that chunk number exceeds max links)', (done) => {
      // TODO
    })

    it('empty directory', (done) => {
      const i = new Importer(ds)
      i.on('file', (file) => {
        expect(file.path).to.equal('empty-dir')
        expect(bs58.encode(file.multihash)).to.equal('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
        expect(file.size).to.equal(4)
        done()
      })
      i.add({path: 'empty-dir'})
      i.finish()
    })

    it.skip('directory with files', (done) => {})

    it.skip('nested directory (2 levels deep)', (done) => {})
  })
  /*
    it('import a small file', (done) => {
      importer.import(small, ds, function (err, stat) {
        expect(err).to.not.exist
        ds.get(stat.Hash, (err, node) => {
          expect(err).to.not.exist
          const smallDAGNode = new DAGNode()
          const buf = fs.readFileSync(small + '.block')
          smallDAGNode.unMarshal(buf)
          expect(node.size()).to.equal(smallDAGNode.size())
          expect(node.multihash()).to.deep.equal(smallDAGNode.multihash())
          done()
        })
      })
    })

    it('import a big file', (done) => {
      importer.import(big, ds, function (err, stat) {
        expect(err).to.not.exist
        ds.get(stat.Hash, (err, node) => {
          expect(err).to.not.exist

          const bigDAGNode = new DAGNode()
          const buf = fs.readFileSync(big + '.block')
          bigDAGNode.unMarshal(buf)
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

          ds.get(node.links[0].hash, (err, node) => {
            expect(err).to.not.exist
            const leaf = new DAGNode()
            const buf2 = fs.readFileSync(big + '.link-block0')
            leaf.unMarshal(buf2)
            expect(node.links).to.deep.equal(leaf.links)
            expect(node.links.length).to.equal(0)
            expect(leaf.links.length).to.equal(0)
            expect(leaf.marshal()).to.deep.equal(buf2)
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

    it('import a small directory', (done) => {
      importer.import(dirSmall, ds, {
        recursive: true
      }, function (err, stats) {
        expect(err).to.not.exist

        ds.get(stats.Hash, (err, node) => {
          expect(err).to.not.exist
          const dirSmallNode = new DAGNode()
          const buf = fs.readFileSync(dirSmall + '.block')
          dirSmallNode.unMarshal(buf)
          expect(node.links).to.deep.equal(dirSmallNode.links)

          const nodeUnixFS = UnixFS.unmarshal(node.data)
          const dirUnixFS = UnixFS.unmarshal(dirSmallNode.data)

          expect(nodeUnixFS.type).to.equal(dirUnixFS.type)
          expect(nodeUnixFS.fileSize()).to.equal(dirUnixFS.fileSize())
          expect(nodeUnixFS.data).to.deep.equal(dirUnixFS.data)
          expect(nodeUnixFS.blockSizes).to.deep.equal(dirUnixFS.blockSizes)
          expect(node.data).to.deep.equal(dirSmallNode.data)
          expect(node.marshal()).to.deep.equal(dirSmallNode.marshal())
          done()
        })
      })
    })

    it('import a big directory', (done) => {
      importer.import(dirBig, ds, {
        recursive: true
      }, function (err, stats) {
        expect(err).to.not.exist

        ds.get(stats.Hash, (err, node) => {
          expect(err).to.not.exist
          const dirNode = new DAGNode()
          const buf = fs.readFileSync(dirBig + '.block')
          dirNode.unMarshal(buf)
          expect(node.links).to.deep.equal(dirNode.links)

          const nodeUnixFS = UnixFS.unmarshal(node.data)
          const dirUnixFS = UnixFS.unmarshal(dirNode.data)

          expect(nodeUnixFS.type).to.equal(dirUnixFS.type)
          expect(nodeUnixFS.fileSize()).to.equal(dirUnixFS.fileSize())
          expect(nodeUnixFS.data).to.deep.equal(dirUnixFS.data)
          expect(nodeUnixFS.blockSizes).to.deep.equal(dirUnixFS.blockSizes)
          expect(node.data).to.deep.equal(dirNode.data)
          expect(node.marshal()).to.deep.equal(dirNode.marshal())
          done()
        })
      })
    })

    it('import a nested directory', (done) => {
      importer.import(dirNested, ds, {
        recursive: true
      }, function (err, stats) {
        expect(err).to.not.exist
        expect(bs58.encode(stats.Hash).toString()).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN')

        ds.get(stats.Hash, (err, node) => {
          expect(err).to.not.exist
          expect(node.links.length).to.equal(3)

          const dirNode = new DAGNode()
          const buf = fs.readFileSync(dirNested + '.block')
          dirNode.unMarshal(buf)
          expect(node.links).to.deep.equal(dirNode.links)
          expect(node.data).to.deep.equal(dirNode.data)
          done()
        })
      })
    })
  */
}
