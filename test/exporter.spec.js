/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const UnixFS = require('ipfs-unixfs')
const pull = require('pull-stream')
const zip = require('pull-zip')
const CID = require('cids')
const doUntil = require('async/doUntil')
const waterfall = require('async/waterfall')
const parallel = require('async/parallel')
const series = require('async/series')
const fs = require('fs')
const path = require('path')
const push = require('pull-pushable')
const toPull = require('stream-to-pull-stream')
const toStream = require('pull-stream-to-stream')
const {
  DAGNode,
  DAGLink
} = require('ipld-dag-pb')
const isNode = require('detect-node')
const randomBytes = require('./helpers/random-bytes')

const exporter = require('../src')
const importer = require('ipfs-unixfs-importer')

const ONE_MEG = Math.pow(1024, 2)
const bigFile = randomBytes(ONE_MEG * 1.2)
const smallFile = randomBytes(200)

describe('exporter', () => {
  let ipld

  function dagPut (options, cb) {
    if (typeof options === 'function') {
      cb = options
      options = {}
    }

    options.type = options.type || 'file'
    options.content = options.content || Buffer.from([0x01, 0x02, 0x03])
    options.links = options.links || []

    const file = new UnixFS(options.type, options.content)

    DAGNode.create(file.marshal(), options.links, (err, node) => {
      expect(err).to.not.exist()

      ipld.put(node, {
        version: 0,
        hashAlg: 'sha2-256',
        format: 'dag-pb'
      }, (err, cid) => {
        cb(err, { file: file, node: node, cid: cid })
      })
    })
  }

  function addTestFile ({ file, strategy = 'balanced', path = '/foo', maxChunkSize, rawLeaves }, cb) {
    pull(
      pull.values([{
        path,
        content: file
      }]),
      importer(ipld, {
        strategy,
        rawLeaves,
        chunkerOptions: {
          maxChunkSize
        }
      }),
      pull.collect((error, nodes) => {
        cb(error, nodes && nodes[0] && nodes[0].multihash)
      })
    )
  }

  function addAndReadTestFile ({ file, offset, length, strategy = 'balanced', path = '/foo', maxChunkSize, rawLeaves }, cb) {
    addTestFile({ file, strategy, path, maxChunkSize, rawLeaves }, (error, multihash) => {
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

  function addTestDirectory ({ directory, strategy = 'balanced', maxChunkSize }, callback) {
    const input = push()
    const dirName = path.basename(directory)

    pull(
      input,
      pull.map((file) => {
        return {
          path: path.join(dirName, path.basename(file)),
          content: toPull.source(fs.createReadStream(file))
        }
      }),
      importer(ipld, {
        strategy,
        maxChunkSize
      }),
      pull.collect(callback)
    )

    const listFiles = (directory, depth, stream, cb) => {
      waterfall([
        (done) => fs.stat(directory, done),
        (stats, done) => {
          if (stats.isDirectory()) {
            return waterfall([
              (done) => fs.readdir(directory, done),
              (children, done) => {
                series(
                  children.map(child => (next) => listFiles(path.join(directory, child), depth + 1, stream, next)),
                  done
                )
              }
            ], done)
          }

          stream.push(directory)
          done()
        }
      ], cb)
    }

    listFiles(directory, 0, input, () => {
      input.end()
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

  before((done) => {
    inMemory(IPLD, (err, resolver) => {
      expect(err).to.not.exist()

      ipld = resolver

      done()
    })
  })

  it('ensure hash inputs are sanitized', (done) => {
    dagPut((err, result) => {
      expect(err).to.not.exist()

      ipld.get(result.cid, (err, res) => {
        expect(err).to.not.exist()
        const unmarsh = UnixFS.unmarshal(result.node.data)

        expect(unmarsh.data).to.deep.equal(result.file.data)

        pull(
          exporter(result.cid, ipld),
          pull.collect(onFiles)
        )

        function onFiles (err, files) {
          expect(err).to.equal(null)
          expect(files).to.have.length(1)
          expect(files[0]).to.have.property('cid')
          expect(files[0]).to.have.property('path', result.cid.toBaseEncodedString())
          fileEql(files[0], unmarsh.data, done)
        }
      })
    })
  })

  it('exports a file with no links', (done) => {
    dagPut((err, result) => {
      expect(err).to.not.exist()

      pull(
        zip(
          pull(
            ipld.getStream(result.cid),
            pull.map((res) => UnixFS.unmarshal(res.value.data))
          ),
          exporter(result.cid, ipld)
        ),
        pull.collect((err, values) => {
          expect(err).to.not.exist()
          const unmarsh = values[0][0]
          const file = values[0][1]

          fileEql(file, unmarsh.data, done)
        })
      )
    })
  })

  it('small file in a directory with an escaped slash in the title', (done) => {
    const fileName = `small-\\/file-${Math.random()}.txt`
    const filePath = `/foo/${fileName}`

    pull(
      pull.values([{
        path: filePath,
        content: pull.values([smallFile])
      }]),
      importer(ipld),
      pull.collect((err, files) => {
        expect(err).to.not.exist()

        const path = `/ipfs/${new CID(files[1].multihash).toBaseEncodedString()}/${fileName}`

        pull(
          exporter(path, ipld),
          pull.collect((err, files) => {
            expect(err).to.not.exist()
            expect(files.length).to.equal(1)
            expect(files[0].path).to.equal(fileName)
            done()
          })
        )
      })
    )
  })

  it('small file in a directory with an square brackets in the title', (done) => {
    const fileName = `small-[bar]-file-${Math.random()}.txt`
    const filePath = `/foo/${fileName}`

    pull(
      pull.values([{
        path: filePath,
        content: pull.values([smallFile])
      }]),
      importer(ipld),
      pull.collect((err, files) => {
        expect(err).to.not.exist()

        const path = `/ipfs/${new CID(files[1].multihash).toBaseEncodedString()}/${fileName}`

        pull(
          exporter(path, ipld),
          pull.collect((err, files) => {
            expect(err).to.not.exist()
            expect(files.length).to.equal(1)
            expect(files[0].path).to.equal(fileName)
            done()
          })
        )
      })
    )
  })

  it('exports a chunk of a file with no links', (done) => {
    const offset = 0
    const length = 5

    dagPut({
      content: randomBytes(100)
    }, (err, result) => {
      expect(err).to.not.exist()

      pull(
        zip(
          pull(
            ipld.getStream(result.cid),
            pull.map((res) => UnixFS.unmarshal(res.value.data))
          ),
          exporter(result.cid, ipld, {
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
  })

  it('exports a small file with links', function (done) {
    waterfall([
      (cb) => dagPut({ content: randomBytes(100) }, cb),
      (file, cb) => dagPut({
        content: randomBytes(100),
        links: [
          new DAGLink('', file.node.size, file.cid)
        ]
      }, cb),
      (result, cb) => {
        pull(
          exporter(result.cid, ipld),
          pull.collect((err, files) => {
            expect(err).to.not.exist()

            fileEql(files[0], result.file.data, cb)
          })
        )
      }
    ], done)
  })

  it('exports a chunk of a small file with links', function (done) {
    const offset = 0
    const length = 5

    waterfall([
      (cb) => dagPut({ content: randomBytes(100) }, cb),
      (file, cb) => dagPut({
        content: randomBytes(100),
        links: [
          new DAGLink('', file.node.size, file.cid)
        ]
      }, cb),
      (result, cb) => {
        pull(
          exporter(result.cid, ipld, {
            offset,
            length
          }),
          pull.collect((err, files) => {
            expect(err).to.not.exist()

            fileEql(files[0], result.file.data.slice(offset, offset + length), cb)
          })
        )
      }
    ], done)
  })

  it('exports a large file > 5mb', function (done) {
    this.timeout(30 * 1000)

    waterfall([
      (cb) => addTestFile({
        file: randomBytes(ONE_MEG * 6)
      }, cb),
      (buf, cb) => cb(null, new CID(buf)),
      (cid, cb) => pull(
        exporter(cid, ipld),
        pull.collect((err, files) => cb(err, { cid, files }))
      ),
      ({ cid, files: [ file ] }, cb) => {
        expect(file).to.have.property('path', cid.toBaseEncodedString())
        expect(file).to.have.property('size', ONE_MEG * 6)
        fileEql(file, null, cb)
      }
    ], done)
  })

  it('exports a chunk of a large file > 5mb', function (done) {
    this.timeout(30 * 1000)

    const offset = 0
    const length = 5
    const bytes = randomBytes(ONE_MEG * 6)

    waterfall([
      (cb) => addTestFile({
        file: bytes
      }, cb),
      (buf, cb) => cb(null, new CID(buf)),
      (cid, cb) => pull(
        exporter(cid, ipld, {
          offset,
          length
        }),
        pull.collect((err, files) => cb(err, { cid, files }))
      ),
      ({ cid, files: [ file ] }, cb) => {
        expect(file).to.have.property('path', cid.toBaseEncodedString())

        pull(
          file.content,
          pull.collect(cb)
        )
      },
      ([ buf ], cb) => {
        expect(buf).to.deep.equal(bytes.slice(offset, offset + length))
        cb()
      }
    ], done)
  })

  it('exports the right chunks of files when offsets are specified', function (done) {
    this.timeout(30 * 1000)
    const offset = 3
    const data = Buffer.alloc(300 * 1024)

    addAndReadTestFile({
      file: data,
      offset: 0
    }, (err, fileWithNoOffset) => {
      expect(err).to.not.exist()

      addAndReadTestFile({
        file: data,
        offset
      }, (err, fileWithOffset) => {
        expect(err).to.not.exist()

        expect(fileWithNoOffset.length).to.equal(data.length)
        expect(fileWithNoOffset.length - fileWithOffset.length).to.equal(offset)
        expect(fileWithOffset.length).to.equal(data.length - offset)
        expect(fileWithNoOffset.length).to.equal(fileWithOffset.length + offset)

        done()
      })
    })
  })

  it('exports a zero length chunk of a large file', function (done) {
    this.timeout(30 * 1000)

    addAndReadTestFile({
      file: bigFile,
      path: '1.2MiB.txt',
      rawLeaves: true,
      length: 0
    }, (err, data) => {
      expect(err).to.not.exist()
      expect(data).to.eql(Buffer.alloc(0))
      done()
    })
  })

  it('exports a directory', function (done) {
    waterfall([
      (cb) => pull(
        pull.values([{
          path: './200Bytes.txt',
          content: randomBytes(ONE_MEG)
        }, {
          path: './dir-another'
        }, {
          path: './level-1/200Bytes.txt',
          content: randomBytes(ONE_MEG)
        }, {
          path: './level-1/level-2'
        }]),
        importer(ipld),
        pull.collect(cb)
      ),
      (files, cb) => cb(null, files.pop().multihash),
      (buf, cb) => cb(null, new CID(buf)),
      (cid, cb) => pull(
        exporter(cid, ipld),
        pull.collect((err, files) => cb(err, { cid, files }))
      ),
      ({ cid, files }, cb) => {
        files.forEach(file => expect(file).to.have.property('cid'))

        expect(
          files.map((file) => file.path)
        ).to.be.eql([
          cid.toBaseEncodedString(),
          `${cid.toBaseEncodedString()}/200Bytes.txt`,
          `${cid.toBaseEncodedString()}/dir-another`,
          `${cid.toBaseEncodedString()}/level-1`,
          `${cid.toBaseEncodedString()}/level-1/200Bytes.txt`,
          `${cid.toBaseEncodedString()}/level-1/level-2`
        ])

        files
          .filter(file => file.type === 'dir')
          .forEach(dir => {
            expect(dir).to.has.property('size', 0)
          })

        pull(
          pull.values(files),
          pull.map((file) => Boolean(file.content)),
          pull.collect(cb)
        )
      },
      (contents, cb) => {
        expect(contents).to.be.eql([
          false,
          true,
          false,
          false,
          true,
          false
        ])
        cb()
      }
    ], done)
  })

  it('exports a directory one deep', function (done) {
    waterfall([
      (cb) => pull(
        pull.values([{
          path: './200Bytes.txt',
          content: randomBytes(ONE_MEG)
        }, {
          path: './dir-another'
        }, {
          path: './level-1'
        }]),
        importer(ipld),
        pull.collect(cb)
      ),
      (files, cb) => cb(null, files.pop().multihash),
      (buf, cb) => cb(null, new CID(buf)),
      (cid, cb) => pull(
        exporter(cid, ipld),
        pull.collect((err, files) => cb(err, { cid, files }))
      ),
      ({ cid, files }, cb) => {
        files.forEach(file => expect(file).to.have.property('cid'))

        expect(
          files.map((file) => file.path)
        ).to.be.eql([
          cid.toBaseEncodedString(),
          `${cid.toBaseEncodedString()}/200Bytes.txt`,
          `${cid.toBaseEncodedString()}/dir-another`,
          `${cid.toBaseEncodedString()}/level-1`
        ])

        pull(
          pull.values(files),
          pull.map((file) => Boolean(file.content)),
          pull.collect(cb)
        )
      },
      (contents, cb) => {
        expect(contents).to.be.eql([
          false,
          true,
          false,
          false
        ])
        cb()
      }
    ], done)
  })

  it('exports a small file imported with raw leaves', function (done) {
    this.timeout(30 * 1000)

    addAndReadTestFile({
      file: smallFile,
      path: '200Bytes.txt',
      rawLeaves: true
    }, (err, data) => {
      expect(err).to.not.exist()
      expect(data).to.eql(smallFile)
      done()
    })
  })

  it('exports a chunk of a small file imported with raw leaves', function (done) {
    this.timeout(30 * 1000)

    const length = 100

    addAndReadTestFile({
      file: smallFile,
      path: '200Bytes.txt',
      rawLeaves: true,
      length
    }, (err, data) => {
      expect(err).to.not.exist()
      expect(data).to.eql(smallFile.slice(0, length))
      done()
    })
  })

  it('exports a chunk of a small file imported with raw leaves with length', function (done) {
    this.timeout(30 * 1000)

    const offset = 100
    const length = 200

    addAndReadTestFile({
      file: smallFile,
      path: '200Bytes.txt',
      rawLeaves: true,
      offset,
      length
    }, (err, data) => {
      expect(err).to.not.exist()
      expect(data).to.eql(smallFile.slice(offset))
      done()
    })
  })

  it('exports a zero length chunk of a small file imported with raw leaves', function (done) {
    this.timeout(30 * 1000)

    const length = 0

    addAndReadTestFile({
      file: smallFile,
      path: '200Bytes.txt',
      rawLeaves: true,
      length
    }, (err, data) => {
      expect(err).to.not.exist()
      expect(data).to.eql(Buffer.alloc(0))
      done()
    })
  })

  it('errors when exporting a chunk of a small file imported with raw leaves and negative length', function (done) {
    this.timeout(30 * 1000)

    const length = -100

    addAndReadTestFile({
      file: smallFile,
      path: '200Bytes.txt',
      rawLeaves: true,
      length
    }, (err, data) => {
      expect(err).to.exist()
      expect(err.message).to.equal('Length must be greater than or equal to 0')
      done()
    })
  })

  it('errors when exporting a chunk of a small file imported with raw leaves and negative offset', function (done) {
    this.timeout(30 * 1000)

    const offset = -100

    addAndReadTestFile({
      file: smallFile,
      path: '200Bytes.txt',
      rawLeaves: true,
      offset
    }, (err, data) => {
      expect(err).to.exist()
      expect(err.message).to.equal('Offset must be greater than or equal to 0')
      done()
    })
  })

  it('errors when exporting a chunk of a small file imported with raw leaves and offset greater than file size', function (done) {
    this.timeout(30 * 1000)

    const offset = 201

    addAndReadTestFile({
      file: smallFile,
      path: '200Bytes.txt',
      rawLeaves: true,
      offset
    }, (err, data) => {
      expect(err).to.exist()
      expect(err.message).to.equal('Offset must be less than the file size')
      done()
    })
  })

  it('exports a large file > 1mb imported with raw leaves', function (done) {
    waterfall([
      (cb) => pull(
        pull.values([{
          path: '1.2MiB.txt',
          content: pull.values([bigFile])
        }]),
        importer(ipld, {
          rawLeaves: true
        }),
        pull.collect(cb)
      ),
      (files, cb) => {
        expect(files.length).to.equal(1)

        pull(
          exporter(files[0].multihash, ipld),
          pull.collect(cb)
        )
      },
      (files, cb) => {
        fileEql(files[0], bigFile, done)
      }
    ], done)
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
      expect(error.message).to.contain('Offset must be greater than or equal to 0')

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

  it('exports a directory containing an empty file whose content gets turned into a ReadableStream', function (done) {
    if (!isNode) {
      return this.skip()
    }

    // replicates the behaviour of ipfs.files.get
    waterfall([
      (cb) => addTestDirectory({
        directory: path.join(__dirname, 'fixtures', 'dir-with-empty-files')
      }, cb),
      (result, cb) => {
        const dir = result.pop()

        pull(
          exporter(dir.multihash, ipld),
          pull.map((file) => {
            if (file.content) {
              file.content = toStream.source(file.content)
              file.content.pause()
            }

            return file
          }),
          pull.collect((error, files) => {
            if (error) {
              return cb(error)
            }

            series(
              files
                .filter(file => Boolean(file.content))
                .map(file => {
                  return (done) => {
                    if (file.content) {
                      file.content
                        .pipe(toStream.sink(pull.collect((error, bufs) => {
                          expect(error).to.not.exist()
                          expect(bufs.length).to.equal(1)
                          expect(bufs[0].length).to.equal(0)

                          done()
                        })))
                    }
                  }
                }),
              cb
            )
          })
        )
      }
    ], done)
  })

  it('fails on non existent hash', (done) => {
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

  it('exports file with data on internal and leaf nodes', function (done) {
    waterfall([
      (cb) => createAndPersistNode(ipld, 'raw', [0x04, 0x05, 0x06, 0x07], [], cb),
      (leaf, cb) => createAndPersistNode(ipld, 'file', [0x00, 0x01, 0x02, 0x03], [
        leaf
      ], cb),
      (file, cb) => {
        pull(
          exporter(file.cid, ipld),
          pull.asyncMap((file, cb) => readFile(file, cb)),
          pull.through(buffer => {
            expect(buffer).to.deep.equal(Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]))
          }),
          pull.collect(cb)
        )
      }
    ], done)
  })

  it('exports file with data on some internal and leaf nodes', function (done) {
    // create a file node with three children:
    // where:
    //   i = internal node without data
    //   d = internal node with data
    //   l = leaf node with data
    //             i
    //          /  |  \
    //         l   d   i
    //             |     \
    //             l      l
    waterfall([
      (cb) => {
        // create leaves
        parallel([
          (next) => createAndPersistNode(ipld, 'raw', [0x00, 0x01, 0x02, 0x03], [], next),
          (next) => createAndPersistNode(ipld, 'raw', [0x08, 0x09, 0x10, 0x11], [], next),
          (next) => createAndPersistNode(ipld, 'raw', [0x12, 0x13, 0x14, 0x15], [], next)
        ], cb)
      },
      (leaves, cb) => {
        parallel([
          (next) => createAndPersistNode(ipld, 'raw', [0x04, 0x05, 0x06, 0x07], [leaves[1]], next),
          (next) => createAndPersistNode(ipld, 'raw', null, [leaves[2]], next)
        ], (error, internalNodes) => {
          if (error) {
            return cb(error)
          }

          createAndPersistNode(ipld, 'file', null, [
            leaves[0],
            internalNodes[0],
            internalNodes[1]
          ], cb)
        })
      },
      (file, cb) => {
        pull(
          exporter(file.cid, ipld),
          pull.asyncMap((file, cb) => readFile(file, cb)),
          pull.through(buffer => {
            expect(buffer).to.deep.equal(
              Buffer.from([
                0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
                0x08, 0x09, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15
              ])
            )
          }),
          pull.collect(cb)
        )
      }
    ], done)
  })

  it('exports file with data on internal and leaf nodes with an offset that only fetches data from leaf nodes', function (done) {
    waterfall([
      (cb) => createAndPersistNode(ipld, 'raw', [0x04, 0x05, 0x06, 0x07], [], cb),
      (leaf, cb) => createAndPersistNode(ipld, 'file', [0x00, 0x01, 0x02, 0x03], [
        leaf
      ], cb),
      (file, cb) => {
        pull(
          exporter(file.cid, ipld, {
            offset: 4
          }),
          pull.asyncMap((file, cb) => readFile(file, cb)),
          pull.through(buffer => {
            expect(buffer).to.deep.equal(Buffer.from([0x04, 0x05, 0x06, 0x07]))
          }),
          pull.collect(cb)
        )
      }
    ], done)
  })

  it('exports file with data on leaf nodes without emitting empty buffers', function (done) {
    this.timeout(30 * 1000)

    pull(
      pull.values([{
        path: '200Bytes.txt',
        content: pull.values([bigFile])
      }]),
      importer(ipld, {
        rawLeaves: true
      }),
      pull.collect(collected)
    )

    function collected (err, files) {
      expect(err).to.not.exist()
      expect(files.length).to.equal(1)

      pull(
        exporter(files[0].multihash, ipld),
        pull.collect((err, files) => {
          expect(err).to.not.exist()
          expect(files.length).to.equal(1)

          pull(
            files[0].content,
            pull.collect((error, buffers) => {
              expect(error).to.not.exist()

              buffers.forEach(buffer => {
                expect(buffer.length).to.not.equal(0)
              })

              done()
            })
          )
        })
      )
    }
  })

  it('exports a raw leaf', (done) => {
    pull(
      pull.values([{
        path: '200Bytes.txt',
        content: pull.values([smallFile])
      }]),
      importer(ipld, {
        rawLeaves: true
      }),
      pull.collect(collected)
    )

    function collected (err, files) {
      expect(err).to.not.exist()
      expect(files.length).to.equal(1)

      pull(
        exporter(files[0].multihash, ipld),
        pull.collect((err, files) => {
          expect(err).to.not.exist()
          expect(files.length).to.equal(1)
          expect(CID.isCID(files[0].cid)).to.be.true()
          fileEql(files[0], smallFile, done)
        })
      )
    }
  })
})

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

function createAndPersistNode (ipld, type, data, children, callback) {
  const file = new UnixFS(type, data ? Buffer.from(data) : undefined)
  const links = []

  children.forEach(child => {
    const leaf = UnixFS.unmarshal(child.node.data)

    file.addBlockSize(leaf.fileSize())

    links.push(new DAGLink('', child.node.size, child.cid))
  })

  DAGNode.create(file.marshal(), links, (error, node) => {
    if (error) {
      return callback(error)
    }

    ipld.put(node, {
      version: 1,
      hashAlg: 'sha2-256',
      format: 'dag-pb'
    }, (error, cid) => callback(error, {
      node,
      cid
    }))
  })
}
