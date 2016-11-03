/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const BlockService = require('ipfs-block-service')
const IPLDResolver = require('ipld-resolver')
const UnixFS = require('ipfs-unixfs')
const bs58 = require('bs58')
const pull = require('pull-stream')
const zip = require('pull-zip')
const CID = require('cids')
const loadFixture = require('aegir/fixtures')

const unixFSEngine = require('./../src')
const exporter = unixFSEngine.exporter

const bigFile = loadFixture(__dirname, 'fixtures/1.2MiB.txt')

module.exports = (repo) => {
  describe('exporter', () => {
    let ipldResolver

    before(() => {
      const bs = new BlockService(repo)
      ipldResolver = new IPLDResolver(bs)
    })

    it('import and export', (done) => {
      pull(
        pull.values([{
          path: '1.2MiB.txt',
          content: pull.values([
            bigFile,
            Buffer('hello world')
          ])
        }]),
        unixFSEngine.importer(ipldResolver),
        pull.map((file) => {
          expect(file.path).to.be.eql('1.2MiB.txt')

          return exporter(file.multihash, ipldResolver)
        }),
        pull.flatten(),
        pull.collect((err, files) => {
          expect(err).to.not.exist
          expect(files[0].size).to.be.eql(bigFile.length + 11)
          fileEql(files[0], Buffer.concat([bigFile, Buffer('hello world')]), done)
        })
      )
    })

    it('ensure hash inputs are sanitized', (done) => {
      const hash = 'QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8'
      const mhBuf = new Buffer(bs58.decode(hash))

      pull(
        ipldResolver.getStream(new CID(hash)),
        pull.map((node) => UnixFS.unmarshal(node.data)),
        pull.collect((err, nodes) => {
          expect(err).to.not.exist

          const unmarsh = nodes[0]

          pull(
            exporter(mhBuf, ipldResolver),
            pull.collect(onFiles)
          )

          function onFiles (err, files) {
            expect(err).to.not.exist
            expect(files).to.have.length(1)
            expect(files[0]).to.have.property('path', hash)

            fileEql(files[0], unmarsh.data, done)
          }
        })
      )
    })

    it('export a file with no links', (done) => {
      const hash = 'QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8'

      pull(
        zip(
          pull(
            ipldResolver.getStream(new CID(hash)),
            pull.map((node) => UnixFS.unmarshal(node.data))
          ),
          exporter(hash, ipldResolver)
        ),
        pull.collect((err, values) => {
          expect(err).to.not.exist
          const unmarsh = values[0][0]
          const file = values[0][1]

          fileEql(file, unmarsh.data, done)
        })
      )
    })

    it('export a small file with links', (done) => {
      const hash = 'QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q'
      pull(
        exporter(hash, ipldResolver),
        pull.collect((err, files) => {
          expect(err).to.not.exist

          fileEql(files[0], bigFile, done)
        })
      )
    })

    it('export a large file > 5mb', (done) => {
      const hash = 'QmRQgufjp9vLE8XK2LGKZSsPCFCF6e4iynCQtNB5X2HBKE'
      pull(
        exporter(hash, ipldResolver),
        pull.collect((err, files) => {
          expect(err).to.not.exist

          expect(files[0]).to.have.property('path', 'QmRQgufjp9vLE8XK2LGKZSsPCFCF6e4iynCQtNB5X2HBKE')
          fileEql(files[0], null, done)
        })
      )
    })

    it('export a directory', (done) => {
      const hash = 'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKjN'

      pull(
        exporter(hash, ipldResolver),
        pull.collect((err, files) => {
          expect(err).to.not.exist

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
              expect(err).to.not.exist
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

    it('returns an empty stream for dir', (done) => {
      const hash = 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'

      pull(
        exporter(hash, ipldResolver),
        pull.collect((err, files) => {
          expect(err).to.not.exist
          expect(files[0].content).to.not.exist
          done()
        })
      )
    })

    it('fails on non existent hash', (done) => {
      // This hash doesn't exist in the repo
      const hash = 'QmWChcSFMNcFkfeJtNd8Yru1rE6PhtCRfewi1tMwjkwKj3'

      pull(
        exporter(hash, ipldResolver),
        pull.collect((err, files) => {
          expect(err).to.exist
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
          expect(Buffer.concat(data)).to.be.eql(f2)
        } else {
          expect(data).to.exist
        }
      } catch (err) {
        return done(err)
      }
      done()
    })
  )
}
