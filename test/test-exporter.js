/* eslint-env mocha */
'use strict'

const unixFSEngine = require('./../src')
const exporter = unixFSEngine.exporter
const expect = require('chai').expect
const BlockService = require('ipfs-blocks').BlockService
const DAGService = require('ipfs-merkle-dag').DAGService
const fsBS = require('fs-blob-store')
const fs = require('fs')
const UnixFS = require('ipfs-unixfs')
const path = require('path')
const Repo = require('ipfs-repo')

let ds

describe('exporter', function () {
  before((done) => {
    const options = { stores: fsBS }
    const r = new Repo(process.env.IPFS_PATH, options)
    const bs = new BlockService(r)
    expect(bs).to.exist
    ds = new DAGService(bs)
    expect(ds).to.exist
    done()
  })

  it('export a file with no links', (done) => {
    const hash = 'QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8'
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
    const testExport = exporter(hash, ds)
    testExport.on('file', (data) => {
      var ws = fs.createWriteStream(path.join(process.cwd(), '/test', data.path))
      data.stream.pipe(ws)
      data.stream.on('end', () => {
        const stats = fs.existsSync(path.join(process.cwd(), '/test', data.path))
        expect(stats).to.equal(true)
        fs.unlinkSync(path.join(process.cwd(), '/test', data.path))
        done()
      })
    })
  })

  it('export a large file > 5mb', (done) => {
    const hash = 'QmRQgufjp9vLE8XK2LGKZSsPCFCF6e4iynCQtNB5X2HBKE'
    const testExport = exporter(hash, ds)
    testExport.on('file', (data) => {
      var ws = fs.createWriteStream(path.join(process.cwd(), '/test', data.path))
      data.stream.pipe(ws)
      data.stream.on('end', () => {
        const stats = fs.existsSync(path.join(process.cwd(), '/test', data.path))
        expect(stats).to.equal(true)
        fs.unlinkSync(path.join(process.cwd(), '/test', data.path))
        done()
      })
    })
  })

  it('export a directory', (done) => {
    const hash = 'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN'
    var testExport = exporter(hash, ds)
    var fs = []
    var x = 0
    testExport.on('file', (data) => {
      fs.push(data)
      x++
      if (x === 4) {
        expect(fs[0].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/200Bytes.txt')
        expect(fs[1].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/dir-another')
        expect(fs[2].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1/200Bytes.txt')
        expect(fs[3].path).to.equal('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1/level-2')
        done()
      }
    })
  })
})

