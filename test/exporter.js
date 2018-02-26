/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const BlockService = require('ipfs-block-service')
const Ipld = require('ipld')
const UnixFS = require('ipfs-unixfs')
const bs58 = require('bs58')
const pull = require('pull-stream')
const zip = require('pull-zip')
const CID = require('cids')
const loadFixture = require('aegir/fixtures')

const unixFSEngine = require('./../src')
const exporter = unixFSEngine.exporter

const bigFile = loadFixture('test/fixtures/1.2MiB.txt')

module.exports = (repo) => {
  describe('exporter', () => {
    let ipld

    before(() => {
      const bs = new BlockService(repo)
      ipld = new Ipld(bs)
    })

    it('ensure hash inputs are sanitized', (done) => {
      const hash = 'QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8'
      const mhBuf = Buffer.from(bs58.decode(hash))
      const cid = new CID(hash)

      ipld.get(cid, (err, result) => {
        expect(err).to.not.exist()
        const node = result.value
        const unmarsh = UnixFS.unmarshal(node.data)

        pull(
          exporter(mhBuf, ipld),
          pull.collect(onFiles)
        )

        function onFiles (err, files) {
          expect(err).to.not.exist()
          expect(files).to.have.length(1)
          expect(files[0]).to.have.property('hash')
          expect(files[0]).to.have.property('path', hash)
          fileEql(files[0], unmarsh.data, done)
        }
      })
    })

    it('export a file with no links', (done) => {
      const hash = 'QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8'

      pull(
        zip(
          pull(
            ipld.getStream(new CID(hash)),
            pull.map((res) => UnixFS.unmarshal(res.value.data))
          ),
          exporter(hash, ipld)
        ),
        pull.collect((err, values) => {
          expect(err).to.not.exist()
          const unmarsh = values[0][0]
          const file = values[0][1]

          fileEql(file, unmarsh.data, done)
        })
      )
    })

    it('export a small file with links', function (done) {
      this.timeout(30 * 1000)
      const hash = 'QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q'
      pull(
        exporter(hash, ipld),
        pull.collect((err, files) => {
          expect(err).to.not.exist()

          fileEql(files[0], bigFile, done)
        })
      )
    })

    it('export a small file with links using CID instead of multihash', function (done) {
      this.timeout(30 * 1000)
      const cid = new CID('QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q')

      pull(
        exporter(cid, ipld),
        pull.collect((err, files) => {
          expect(err).to.not.exist()

          fileEql(files[0], bigFile, done)
        })
      )
    })

    it('export a large file > 5mb', function (done) {
      this.timeout(30 * 1000)
      const hash = 'QmRQgufjp9vLE8XK2LGKZSsPCFCF6e4iynCQtNB5X2HBKE'
      pull(
        exporter(hash, ipld),
        pull.collect((err, files) => {
          expect(err).to.not.exist()

          expect(files[0]).to.have.property('path', 'QmRQgufjp9vLE8XK2LGKZSsPCFCF6e4iynCQtNB5X2HBKE')
          fileEql(files[0], null, done)
        })
      )
    })

    it('export a directory', function (done) {
      this.timeout(30 * 1000)
      const hash = 'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN'

      pull(
        exporter(hash, ipld),
        pull.collect((err, files) => {
          expect(err).to.not.exist()
          files.forEach(file => expect(file).to.have.property('hash'))

          expect(
            files.map((file) => file.path)
          ).to.be.eql([
            'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN',
            'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/200Bytes.txt',
            'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/dir-another',
            'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1',
            'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1/200Bytes.txt',
            'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1/level-2'
          ])

          pull(
            pull.values(files),
            pull.map((file) => Boolean(file.content)),
            pull.collect((err, contents) => {
              expect(err).to.not.exist()
              expect(contents).to.be.eql([
                false,
                true,
                false,
                false,
                true,
                false
              ])
              done()
            })
          )
        })
      )
    })

    it('export a directory one deep', function (done) {
      this.timeout(30 * 1000)
      const hash = 'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN'

      pull(
        exporter(hash, ipld, { maxDepth: 1 }),
        pull.collect((err, files) => {
          expect(err).to.not.exist()
          files.forEach(file => expect(file).to.have.property('hash'))

          expect(
            files.map((file) => file.path)
          ).to.be.eql([
            'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN',
            'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/200Bytes.txt',
            'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/dir-another',
            'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN/level-1'
          ])

          pull(
            pull.values(files),
            pull.map((file) => Boolean(file.content)),
            pull.collect((err, contents) => {
              expect(err).to.not.exist()
              expect(contents).to.be.eql([
                false,
                true,
                false,
                false
              ])
              done()
            })
          )
        })
      )
    })

    it('returns an empty stream for dir', (done) => {
      const hash = 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'

      pull(
        exporter(hash, ipld),
        pull.collect((err, files) => {
          expect(err).to.not.exist()
          expect(files[0].content).to.not.exist()
          done()
        })
      )
    })

    // TODO: This needs for the stores to have timeouts,
    // otherwise it is impossible to predict if a file doesn't
    // really exist
    it.skip('fails on non existent hash', (done) => {
      // This hash doesn't exist in the repo
      const hash = 'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKj3'

      pull(
        exporter(hash, ipld),
        pull.collect((err, files) => {
          expect(err).to.exist()
          done()
        })
      )
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
