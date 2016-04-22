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
      i.on('error', (err) => {
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

    it('directory with files', (done) => {
      const r1 = streamifier.createReadStream(smallFile)
      const r2 = streamifier.createReadStream(bigFile)

      const i = new Importer(ds)
      var counter = 0
      i.on('file', (file) => {
        counter++
        if (file.path === 'pim/200Bytes.txt') {
          expect(bs58.encode(file.multihash).toString())
            .to.equal('QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8')
        }
        if (file.path === 'pim/1.2MiB.txt') {
          expect(bs58.encode(file.multihash).toString())
            .to.equal('QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q')
        }
        if (file.path === 'pim') {
          expect(bs58.encode(file.multihash).toString())
            .to.equal('QmY8a78tx6Tk6naDgWCgTsd9EqGrUJRrH7dDyQhjyrmH2i')
        }
        if (counter === 3) {
          done()
        }
      })
      i.on('error', (err) => {
        expect(err).to.not.exist
      })
      i.add({path: 'pim/200Bytes.txt', stream: r1})
      i.add({path: 'pim/1.2MiB.txt', stream: r2})
      i.finish()
    })

    it('nested directory (2 levels deep)', (done) => {
      const r1 = streamifier.createReadStream(smallFile)
      const r2 = streamifier.createReadStream(bigFile)
      const r3 = streamifier.createReadStream(bigFile)

      const i = new Importer(ds)
      var counter = 0
      i.on('file', (file) => {
        counter++
        if (file.path === 'pam/pum/200Bytes.txt') {
          expect(bs58.encode(file.multihash).toString())
            .to.equal('QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8')
        }
        if (file.path === 'pam/pum/1.2MiB.txt') {
          expect(bs58.encode(file.multihash).toString())
            .to.equal('QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q')
        }
        if (file.path === 'pam/1.2MiB.txt') {
          expect(bs58.encode(file.multihash).toString())
            .to.equal('QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q')
        }
        if (file.path === 'pam/pum') {
          expect(bs58.encode(file.multihash).toString())
            .to.equal('QmY8a78tx6Tk6naDgWCgTsd9EqGrUJRrH7dDyQhjyrmH2i')
        }
        if (file.path === 'pam') {
          expect(bs58.encode(file.multihash).toString())
            .to.equal('QmRgdtzNx1H1BPJqShdhvWZ2D4DA2HUgZJ3XLtoXei27Av')
        }
        if (counter === 5) {
          done()
        }
      })
      i.on('error', (err) => {
        expect(err).to.not.exist
      })
      i.add({path: 'pam/pum/200Bytes.txt', stream: r1})
      i.add({path: 'pam/pum/1.2MiB.txt', stream: r2})
      i.add({path: 'pam/1.2MiB.txt', stream: r3})
      i.finish()
    })
  })
}
