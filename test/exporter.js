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
const doUntil = require('async/doUntil')
const waterfall = require('async/waterfall')

const unixFSEngine = require('./../src')
const exporter = unixFSEngine.exporter
const importer = unixFSEngine.importer

const bigFile = loadFixture('test/fixtures/1.2MiB.txt')

module.exports = (repo) => {
  describe('exporter', () => {
    let ipld

    function addTestFile ({file, strategy = 'balanced', path = '/foo', maxChunkSize}, cb) {
      pull(
        pull.values([{
          path,
          content: file
        }]),
        importer(ipld, {
          strategy,
          chunkerOptions: {
            maxChunkSize
          }
        }),
        pull.collect((error, nodes) => {
          cb(error, nodes && nodes[0] && nodes[0].multihash)
        })
      )
    }

    function addAndReadTestFile ({file, offset, length, strategy = 'balanced', path = '/foo', maxChunkSize}, cb) {
      addTestFile({file, strategy, path, maxChunkSize}, (error, multihash) => {
        if (error) {
          return cb(error)
        }

        pull(
          exporter(multihash, ipld, {
            offset, length
          }),
          pull.collect((error, files) => {
            if (error) {
              return cb(error)
            }

            readFile(files[0], cb)
          })
        )
      })
    }

    function checkBytesThatSpanBlocks (strategy, cb) {
      const bytesInABlock = 262144
      const bytes = Buffer.alloc(bytesInABlock + 100, 0)

      bytes[bytesInABlock - 1] = 1
      bytes[bytesInABlock] = 2
      bytes[bytesInABlock + 1] = 3

      addAndReadTestFile({
        file: bytes,
        offset: bytesInABlock - 1,
        length: 3,
        strategy
      }, (error, data) => {
        if (error) {
          return cb(error)
        }

        expect(data).to.deep.equal(Buffer.from([1, 2, 3]))

        cb()
      })
    }

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

    it('exports a file with no links', (done) => {
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

    it('exports a chunk of a file with no links', (done) => {
      const hash = 'QmQmZQxSKQppbsWfVzBvg59Cn3DKtsNVQ94bjAxg2h3Lb8'
      const offset = 0
      const length = 5

      pull(
        zip(
          pull(
            ipld.getStream(new CID(hash)),
            pull.map((res) => UnixFS.unmarshal(res.value.data))
          ),
          exporter(hash, ipld, {
            offset,
            length
          })
        ),
        pull.collect((err, values) => {
          expect(err).to.not.exist()

          const unmarsh = values[0][0]
          const file = values[0][1]

          fileEql(file, unmarsh.data.slice(offset, offset + length), done)
        })
      )
    })

    it('exports a small file with links', function (done) {
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

    it('exports a chunk of a small file with links', function (done) {
      this.timeout(30 * 1000)
      const hash = 'QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q'
      const offset = 0
      const length = 5

      pull(
        exporter(hash, ipld, {
          offset,
          length
        }),
        pull.collect((err, files) => {
          expect(err).to.not.exist()

          fileEql(files[0], bigFile.slice(offset, offset + length), done)
        })
      )
    })

    it('exports a small file with links using CID instead of multihash', function (done) {
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

    it('exports a chunk of a small file with links using CID instead of multihash', function (done) {
      this.timeout(30 * 1000)
      const cid = new CID('QmW7BDxEbGqxxSYVtn3peNPQgdDXbWkoQ6J1EFYAEuQV3Q')
      const offset = 0
      const length = 5

      pull(
        exporter(cid, ipld, {
          offset,
          length
        }),
        pull.collect((err, files) => {
          expect(err).to.not.exist()

          fileEql(files[0], bigFile.slice(offset, offset + length), done)
        })
      )
    })

    it('exports a large file > 5mb', function (done) {
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

    it('exports a chunk of a large file > 5mb', function (done) {
      this.timeout(30 * 1000)
      const hash = 'QmRQgufjp9vLE8XK2LGKZSsPCFCF6e4iynCQtNB5X2HBKE'
      const offset = 0
      const length = 5

      pull(
        exporter(hash, ipld, {
          offset,
          length
        }),
        pull.collect((err, files) => {
          expect(err).to.not.exist()

          expect(files[0]).to.have.property('path', 'QmRQgufjp9vLE8XK2LGKZSsPCFCF6e4iynCQtNB5X2HBKE')
          fileEql(files[0], null, done)
        })
      )
    })

    it('exports a chunk of a large file > 5mb made from multiple blocks', function (done) {
      this.timeout(30 * 1000)
      const hash = 'QmRQgufjp9vLE8XK2LGKZSsPCFCF6e4iynCQtNB5X2HBKE'
      const bytesInABlock = 262144
      const offset = bytesInABlock - 1
      const length = bytesInABlock + 1

      pull(
        exporter(hash, ipld, {
          offset,
          length
        }),
        pull.collect((err, files) => {
          expect(err).to.not.exist()

          expect(files[0]).to.have.property('path', 'QmRQgufjp9vLE8XK2LGKZSsPCFCF6e4iynCQtNB5X2HBKE')
          fileEql(files[0], null, done)
        })
      )
    })

    it('exports a directory', function (done) {
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

    it('exports a directory one deep', function (done) {
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

    it('reads bytes with an offset', (done) => {
      addAndReadTestFile({
        file: Buffer.from([0, 1, 2, 3]),
        offset: 1
      }, (error, data) => {
        expect(error).to.not.exist()
        expect(data).to.deep.equal(Buffer.from([1, 2, 3]))

        done()
      })
    })

    it('reads bytes with a negative offset', (done) => {
      addAndReadTestFile({
        file: Buffer.from([0, 1, 2, 3]),
        offset: -1
      }, (error, data) => {
        expect(error).to.be.ok()
        expect(error.message).to.contain('Offset must be greater than 0')

        done()
      })
    })

    it('reads bytes with an offset and a length', (done) => {
      addAndReadTestFile({
        file: Buffer.from([0, 1, 2, 3]),
        offset: 0,
        length: 1
      }, (error, data) => {
        expect(error).to.not.exist()
        expect(data).to.deep.equal(Buffer.from([0]))

        done()
      })
    })

    it('reads bytes with a negative length', (done) => {
      addAndReadTestFile({
        file: Buffer.from([0, 1, 2, 3, 4]),
        offset: 2,
        length: -1
      }, (error, data) => {
        expect(error).to.be.ok()
        expect(error.message).to.contain('Length must be greater than or equal to 0')

        done()
      })
    })

    it('reads bytes with an offset and a length', (done) => {
      addAndReadTestFile({
        file: Buffer.from([0, 1, 2, 3, 4]),
        offset: 1,
        length: 4
      }, (error, data) => {
        expect(error).to.not.exist()
        expect(data).to.deep.equal(Buffer.from([1, 2, 3, 4]))

        done()
      })
    })

    it('reads files that are split across lots of nodes', function (done) {
      this.timeout(30 * 1000)

      addAndReadTestFile({
        file: bigFile,
        offset: 0,
        length: bigFile.length,
        maxChunkSize: 1024
      }, (error, data) => {
        expect(error).to.not.exist()
        expect(data).to.deep.equal(bigFile)

        done()
      })
    })

    it('reads files in multiple steps that are split across lots of nodes in really small chunks', function (done) {
      this.timeout(600 * 1000)

      let results = []
      let chunkSize = 1024
      let offset = 0

      addTestFile({
        file: bigFile,
        maxChunkSize: 1024
      }, (error, multihash) => {
        expect(error).to.not.exist()

        doUntil(
          (cb) => {
            waterfall([
              (next) => {
                pull(
                  exporter(multihash, ipld, {
                    offset,
                    length: chunkSize
                  }),
                  pull.collect(next)
                )
              },
              (files, next) => readFile(files[0], next)
            ], cb)
          },
          (result) => {
            results.push(result)

            offset += result.length

            return offset >= bigFile.length
          },
          (error) => {
            expect(error).to.not.exist()

            const buffer = Buffer.concat(results)

            expect(buffer).to.deep.equal(bigFile)

            done()
          }
        )
      })
    })

    it('reads bytes with an offset and a length that span blocks using balanced layout', (done) => {
      checkBytesThatSpanBlocks('balanced', done)
    })

    it('reads bytes with an offset and a length that span blocks using flat layout', (done) => {
      checkBytesThatSpanBlocks('flat', done)
    })

    it('reads bytes with an offset and a length that span blocks using trickle layout', (done) => {
      checkBytesThatSpanBlocks('trickle', done)
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

function fileEql (actual, expected, done) {
  readFile(actual, (error, data) => {
    if (error) {
      return done(error)
    }

    try {
      if (expected) {
        expect(data).to.eql(expected)
      } else {
        expect(data).to.exist()
      }
    } catch (err) {
      return done(err)
    }

    done()
  })
}

function readFile (file, done) {
  pull(
    file.content,
    pull.collect((error, data) => {
      if (error) {
        return done(error)
      }

      done(null, Buffer.concat(data))
    })
  )
}
