/* eslint-env mocha */
'use strict'

const unixFSEngine = require('./../src')
const exporter = unixFSEngine.exporter
const expect = require('chai').expect
const BlockService = require('ipfs-block-service')
const DAGService = require('ipfs-merkle-dag').DAGService
const UnixFS = require('ipfs-unixfs')
const concat = require('concat-stream')
const fs = require('fs')
const path = require('path')

let ds

module.exports = function (repo) {
  describe('exporter', function () {
    const bigFile = fs.readFileSync(path.join(__dirname, '/test-data/1.2MiB.txt'))
    before((done) => {
      const bs = new BlockService(repo)
      expect(bs).to.exist
      ds = new DAGService(bs)
      expect(ds).to.exist
      done()
    })

    it('export a file with no links', (done) => {
      const hash = 'QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8'
      const bs = new BlockService(repo)
      const ds = new DAGService(bs)
      ds.get(hash, (err, fetchedNode) => {
        const unmarsh = UnixFS.unmarshal(fetchedNode.data)
        expect(err).to.not.exist
        const testExport = exporter(hash, ds)
        testExport.on('error', (err) => {
          expect(err).to.not.exist
        })
        testExport.pipe(concat((files) => {
          expect(files).to.be.length(1)
          files[0].content.pipe(concat((bldata) => {
            expect(bldata).to.deep.equal(unmarsh.data)
            done()
          }))
        }))
      })
    })

    it('export a small file with links', (done) => {
      const hash = 'QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q'
      const bs = new BlockService(repo)
      const ds = new DAGService(bs)
      const testExport = exporter(hash, ds)
      testExport.on('error', (err) => {
        expect(err).to.not.exist
      })
      testExport.on('data', (file) => {
        file.content.pipe(concat((bldata) => {
          expect(bldata).to.deep.equal(bigFile)
          done()
        }))
      })
    })

    it('export a large file > 5mb', (done) => {
      const hash = 'QmRQgufjp9vLE8XK2LGKZSsPCFCF6e4iynCQtNB5X2HBKE'
      const bs = new BlockService(repo)
      const ds = new DAGService(bs)
      const testExport = exporter(hash, ds)
      testExport.on('error', (err) => {
        expect(err).to.not.exist
      })
      testExport.on('data', (file) => {
        expect(file.path).to.equal('QmRQgufjp9vLE8XK2LGKZSsPCFCF6e4iynCQtNB5X2HBKE')
        file.content.pipe(concat((bldata) => {
          expect(bldata).to.exist
          done()
        }))
      })
    })

    it('export a directory', (done) => {
      const hash = 'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN'
      const bs = new BlockService(repo)
      const ds = new DAGService(bs)
      const testExport = exporter(hash, ds)
      testExport.on('error', (err) => {
        expect(err).to.not.exist
      })
      testExport.pipe(concat((files) => {
        expect(files[0].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/200Bytes.txt')
        expect(files[1].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/dir-another')
        expect(files[2].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1/200Bytes.txt')
        expect(files[3].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1/level-2')
        done()
      }))
    })

    it('returns a null stream for dir', (done) => {
      const hash = 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn' // This hash doesn't exist in the repo
      const bs = new BlockService(repo)
      const ds = new DAGService(bs)
      const testExport = exporter(hash, ds)
      testExport.on('error', (err) => {
        expect(err).to.not.exist
      })
      testExport.on('data', (dir) => {
        expect(dir.content).to.equal(null)
        done()
      })
    })

    it('fails on non existent hash', (done) => {
      const hash = 'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKj3' // This hash doesn't exist in the repo
      const bs = new BlockService(repo)
      const ds = new DAGService(bs)
      const testExport = exporter(hash, ds)
      testExport.on('error', (err) => {
        const error = err.toString()
        expect(err).to.exist
        const browser = error.includes('Error: key not found:')
        const node = error.includes('no such file or directory')
        // the browser and node js return different errors
        if (browser) {
          expect(error).to.contain('Error: key not found:')
          done()
        }
        if (node) {
          expect(error).to.contain('no such file or directory')
          done()
        }
        if (!node && !browser) {
          expect(node).to.equal(true)
          done()
        }
      })
    })
  })
}
