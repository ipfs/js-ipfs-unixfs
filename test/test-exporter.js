/* eslint-env mocha */
'use strict'

const unixFSEngine = require('./../src')
const exporter = unixFSEngine.exporter
const expect = require('chai').expect
const BlockService = require('ipfs-block-service')
const DAGService = require('ipfs-merkle-dag').DAGService
const UnixFS = require('ipfs-unixfs')

let ds

module.exports = function (repo) {
  describe('exporter', function () {
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
      var fsa = []
      testExport.on('file', (data) => {
        fsa.push(data)
      })
      setTimeout(() => {
        expect(fsa[0].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/200Bytes.txt')
        expect(fsa[1].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/dir-another')
        expect(fsa[2].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1/200Bytes.txt')
        expect(fsa[3].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1/level-2')
        done()
      }, 1000)
    })
  })
}
