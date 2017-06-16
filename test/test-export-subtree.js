/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const BlockService = require('ipfs-block-service')
const IPLDResolver = require('ipld-resolver')
const CID = require('cids')
const loadFixture = require('aegir/fixtures')

const pull = require('pull-stream')
const Buffer = require('safe-buffer').Buffer

const unixFSEngine = require('./../src')
const exporter = unixFSEngine.exporter

const smallFile = loadFixture(__dirname, 'fixtures/200Bytes.txt')

module.exports = (repo) => {
  describe('exporter', () => {
    let ipldResolver

    before(() => {
      const bs = new BlockService(repo)
      ipldResolver = new IPLDResolver(bs)
    })

    it('export a file 2 levels down', (done) => {
      const hash = 'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1/200Bytes.txt'

      pull(
        exporter(hash, ipldResolver),
        pull.collect((err, files) => {
          expect(err).to.not.exist()
          expect(files.length).to.equal(1)
          expect(files[0].path).to.equal('200Bytes.txt')
          fileEql(files[0], smallFile, done)
        })
      )
    })

    it('export dir 1 level down', (done) => {
      const hash = 'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1'

      pull(
        exporter(hash, ipldResolver),
        pull.collect((err, files) => {
          console.log(files)
          expect(err).to.not.exist()
          expect(files.length).to.equal(3)
          expect(files[0].path).to.equal('level-1')
          expect(files[1].path).to.equal('level-1/200Bytes.txt')
          expect(files[2].path).to.equal('level-1/level-2')
          fileEql(files[1], smallFile, done)
        })
      )
    })

    it('export a non existing file', (done) => {
      const hash = 'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/doesnotexist'

      pull(
        exporter(hash, ipldResolver),
        pull.collect((err, files) => {
          expect(err).to.not.exist()
          expect(files.length).to.equal(0)
          done()
        })
      )
    })

    it('exports starting from non-protobuf node', (done) => {
      const doc = { a: { file: new CID('QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN') } }
      ipldResolver.put(doc, { format: 'dag-cbor' }, (err, cid) => {
        expect(err).to.not.exist()
        const nodeCID = cid.toBaseEncodedString()

        pull(
          exporter(nodeCID + '/a/file/level-1/200Bytes.txt', ipldResolver),
          pull.collect((err, files) => {
            expect(err).to.not.exist()
            expect(files.length).to.equal(1)
            expect(files[0].path).to.equal('200Bytes.txt')
            fileEql(files[0], smallFile, done)
          })
        )
      })
    })
  })
}

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
