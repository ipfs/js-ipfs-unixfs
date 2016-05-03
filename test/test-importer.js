/* eslint-env mocha */
'use strict'

const Importer = require('./../src').importer
const expect = require('chai').expect
const BlockService = require('ipfs-block-service')
const DAGService = require('ipfs-merkle-dag').DAGService
const bs58 = require('bs58')
const fs = require('fs')
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
      i.on('data', (obj) => {
        expect(obj.path).to.equal('200Bytes.txt')
        expect(bs58.encode(obj.multihash)).to.equal('QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8')
        expect(obj.size).to.equal(211)
      })
      i.write({path: '200Bytes.txt', stream: r})
      i.end()
      i.on('end', () => {
        done()
      })
    })

    it('small file (smaller than a chunk) inside a dir', (done) => {
      const buffered = smallFile
      const r = streamifier.createReadStream(buffered)
      const i = new Importer(ds)
      i.on('data', (file) => {
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
      })
      i.on('error', (err) => {
        expect(err).to.not.exist
      })
      i.on('end', () => {
        done()
      })
      i.write({path: 'foo/bar/200Bytes.txt', stream: r})
      i.end()
    })

    it('file bigger than a single chunk', (done) => {
      const buffered = bigFile
      const r = streamifier.createReadStream(buffered)
      const i = new Importer(ds)
      i.on('data', (file) => {
        expect(file.path).to.equal('1.2MiB.txt')
        expect(bs58.encode(file.multihash)).to.equal('QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q')
        expect(file.size).to.equal(1258318)
      })
      i.on('end', () => {
        done()
      })
      i.write({path: '1.2MiB.txt', stream: r})
      i.end()
    })

    it('file bigger than a single chunk inside a dir', (done) => {
      const buffered = bigFile
      const r = streamifier.createReadStream(buffered)
      const i = new Importer(ds)
      i.on('data', (file) => {
        if (file.path === 'foo-big/1.2Mib.txt') {
          expect(bs58.encode(file.multihash)).to.equal('QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q')
          expect(file.size).to.equal(1258318)
        }
        if (file.path === 'foo-big') {
          expect(bs58.encode(file.multihash)).to.equal('QmaFgyFJUP4fxFySJCddg2Pj6rpwSywopWk87VEVv52RSj')
          expect(file.size).to.equal(1258376)
        }
      })
      i.on('end', () => {
        done()
      })
      i.write({path: 'foo-big/1.2MiB.txt', stream: r})
      i.end()
    })

    it.skip('file (that chunk number exceeds max links)', (done) => {
      // TODO
    })

    it('empty directory', (done) => {
      const i = new Importer(ds)
      i.on('data', (file) => {
        expect(file.path).to.equal('empty-dir')
        expect(bs58.encode(file.multihash)).to.equal('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
        expect(file.size).to.equal(4)
      })
      i.on('error', (err) => {
        expect(err).to.not.exist
      })
      i.on('end', () => {
        done()
      })
      i.write({path: 'empty-dir'})
      i.end()
    })

    it('directory with files', (done) => {
      const r1 = streamifier.createReadStream(smallFile)
      const r2 = streamifier.createReadStream(bigFile)

      const i = new Importer(ds)
      i.on('data', (file) => {
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
      })
      i.on('error', (err) => {
        expect(err).to.not.exist
      })
      i.on('end', () => {
        done()
      })
      i.write({path: 'pim/200Bytes.txt', stream: r1})
      i.write({path: 'pim/1.2MiB.txt', stream: r2})
      i.end()
    })

    it('nested directory (2 levels deep)', (done) => {
      const r1 = streamifier.createReadStream(smallFile)
      const r2 = streamifier.createReadStream(bigFile)
      const r3 = streamifier.createReadStream(bigFile)

      const i = new Importer(ds)
      i.on('data', (file) => {
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
      })
      i.on('error', (err) => {
        expect(err).to.not.exist
      })
      i.on('end', () => {
        done()
      })
      i.write({path: 'pam/pum/200Bytes.txt', stream: r1})
      i.write({path: 'pam/pum/1.2MiB.txt', stream: r2})
      i.write({path: 'pam/1.2MiB.txt', stream: r3})
      i.end()
    })
  })
}
