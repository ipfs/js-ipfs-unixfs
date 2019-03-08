/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const CID = require('cids')
const pull = require('pull-stream')
const randomBytes = require('./helpers/random-bytes')
const waterfall = require('async/waterfall')
const importer = require('ipfs-unixfs-importer')

const ONE_MEG = Math.pow(1024, 2)

const exporter = require('./../src')

describe('exporter subtree', () => {
  let ipld

  before((done) => {
    inMemory(IPLD, (err, resolver) => {
      expect(err).to.not.exist()

      ipld = resolver

      done()
    })
  })

  it('exports a file 2 levels down', (done) => {
    const content = randomBytes(ONE_MEG)

    waterfall([
      (cb) => pull(
        pull.values([{
          path: './200Bytes.txt',
          content: randomBytes(ONE_MEG)
        }, {
          path: './level-1/200Bytes.txt',
          content
        }]),
        importer(ipld),
        pull.collect(cb)
      ),
      (files, cb) => cb(null, files.pop().multihash),
      (buf, cb) => cb(null, new CID(buf)),
      (cid, cb) => pull(
        exporter(`${cid.toBaseEncodedString()}/level-1/200Bytes.txt`, ipld),
        pull.collect((err, files) => cb(err, { cid, files }))
      ),
      ({ cid, files }, cb) => {
        files.forEach(file => expect(file).to.have.property('cid'))

        expect(files.length).to.equal(1)
        expect(files[0].path).to.equal('200Bytes.txt')
        fileEql(files[0], content, cb)
      }
    ], done)
  })

  it('exports a directory 1 level down', (done) => {
    const content = randomBytes(ONE_MEG)

    waterfall([
      (cb) => pull(
        pull.values([{
          path: './200Bytes.txt',
          content: randomBytes(ONE_MEG)
        }, {
          path: './level-1/200Bytes.txt',
          content
        }, {
          path: './level-1/level-2'
        }]),
        importer(ipld),
        pull.collect(cb)
      ),
      (files, cb) => cb(null, files.pop().multihash),
      (buf, cb) => cb(null, new CID(buf)),
      (cid, cb) => pull(
        exporter(`${cid.toBaseEncodedString()}/level-1`, ipld),
        pull.collect((err, files) => cb(err, { cid, files }))
      ),
      ({ cid, files }, cb) => {
        expect(files.length).to.equal(3)
        expect(files[0].path).to.equal('level-1')
        expect(files[1].path).to.equal('level-1/200Bytes.txt')
        expect(files[2].path).to.equal('level-1/level-2')
        fileEql(files[1], content, cb)
      }
    ], done)
  })

  it('export a non existing file from a directory', (done) => {
    waterfall([
      (cb) => pull(
        pull.values([{
          path: '/derp/200Bytes.txt',
          content: randomBytes(ONE_MEG)
        }]),
        importer(ipld),
        pull.collect(cb)
      ),
      (files, cb) => cb(null, files.pop().multihash),
      (buf, cb) => cb(null, new CID(buf)),
      (cid, cb) => pull(
        exporter(`${cid.toBaseEncodedString()}/doesnotexist`, ipld),
        pull.collect((err, files) => cb(err, { cid, files }))
      ),
      ({ cid, files }, cb) => {
        expect(files.length).to.equal(0)
        cb()
      }
    ], done)
  })

  it('exports starting from non-protobuf node', (done) => {
    const content = randomBytes(ONE_MEG)

    waterfall([
      (cb) => pull(
        pull.values([{
          path: './level-1/200Bytes.txt',
          content
        }]),
        importer(ipld, {
          wrapWithDirectory: true
        }),
        pull.collect(cb)
      ),
      (files, cb) => cb(null, files.pop().multihash),
      (buf, cb) => cb(null, new CID(buf)),
      (cid, cb) => ipld.put({ a: { file: cid } }, { format: 'dag-cbor' }, cb),
      (cborNodeCid, cb) => pull(
        exporter(`${cborNodeCid.toBaseEncodedString()}/a/file/level-1/200Bytes.txt`, ipld),
        pull.collect(cb)
      ),
      (files, cb) => {
        expect(files.length).to.equal(1)
        expect(files[0].path).to.equal('200Bytes.txt')
        fileEql(files[0], content, cb)
      }
    ], done)
  })

  it('exports all components of a path', (done) => {
    const content = randomBytes(ONE_MEG)

    waterfall([
      (cb) => pull(
        pull.values([{
          path: './200Bytes.txt',
          content: randomBytes(ONE_MEG)
        }, {
          path: './level-1/200Bytes.txt',
          content
        }, {
          path: './level-1/level-2'
        }, {
          path: './level-1/level-2/200Bytes.txt',
          content
        }]),
        importer(ipld),
        pull.collect(cb)
      ),
      (files, cb) => cb(null, files.pop().multihash),
      (buf, cb) => cb(null, new CID(buf)),
      (cid, cb) => pull(
        exporter(`${cid.toBaseEncodedString()}/level-1/level-2/200Bytes.txt`, ipld, {
          fullPath: true
        }),
        pull.collect((err, files) => cb(err, { cid, files }))
      ),
      ({ cid, files }, cb) => {
        expect(files.length).to.equal(4)
        expect(files[0].path).to.equal(cid.toBaseEncodedString())
        expect(files[0].name).to.equal(cid.toBaseEncodedString())
        expect(files[1].path).to.equal(`${cid.toBaseEncodedString()}/level-1`)
        expect(files[1].name).to.equal('level-1')
        expect(files[2].path).to.equal(`${cid.toBaseEncodedString()}/level-1/level-2`)
        expect(files[2].name).to.equal('level-2')
        expect(files[3].path).to.equal(`${cid.toBaseEncodedString()}/level-1/level-2/200Bytes.txt`)
        expect(files[3].name).to.equal('200Bytes.txt')

        cb()
      }
    ], done)
  })
})

function fileEql (f1, f2, done) {
  pull(
    f1.content,
    pull.collect((err, data) => {
      if (err) {
        return done(err)
      }

      try {
        if (f2) {
          expect(Buffer.concat(data)).to.eql(f2)
        } else {
          expect(data).to.exist()
        }
      } catch (err) {
        return done(err)
      }
      done()
    })
  )
}
