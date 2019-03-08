/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const UnixFS = require('ipfs-unixfs')
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const collect = require('pull-stream/sinks/collect')
const CID = require('cids')
const waterfall = require('async/waterfall')
const parallel = require('async/parallel')
const randomBytes = require('./helpers/random-bytes')
const exporter = require('../src')
const importer = require('ipfs-unixfs-importer')
const {
  DAGLink,
  DAGNode
} = require('ipld-dag-pb')

const SHARD_SPLIT_THRESHOLD = 10

describe('exporter sharded', function () {
  this.timeout(30000)

  let ipld

  const createShard = (numFiles, callback) => {
    createShardWithFileNames(numFiles, (index) => `file-${index}`, callback)
  }

  const createShardWithFileNames = (numFiles, fileName, callback) => {
    const files = new Array(numFiles).fill(0).map((_, index) => ({
      path: fileName(index),
      content: Buffer.from([0, 1, 2, 3, 4, index])
    }))

    createShardWithFiles(files, callback)
  }

  const createShardWithFiles = (files, callback) => {
    pull(
      values(files),
      importer(ipld, {
        shardSplitThreshold: SHARD_SPLIT_THRESHOLD,
        wrap: true
      }),
      collect((err, files) => {
        callback(err, files ? new CID(files.pop().multihash) : undefined)
      })
    )
  }

  before((done) => {
    inMemory(IPLD, (err, resolver) => {
      expect(err).to.not.exist()

      ipld = resolver

      done()
    })
  })

  it('exports a sharded directory', (done) => {
    const files = {}
    let directory

    for (let i = 0; i < (SHARD_SPLIT_THRESHOLD + 1); i++) {
      files[`file-${Math.random()}.txt`] = {
        content: randomBytes(100)
      }
    }

    waterfall([
      (cb) => pull(
        pull.values(
          Object.keys(files).map(path => ({
            path,
            content: files[path].content
          }))
        ),
        importer(ipld, {
          wrap: true,
          shardSplitThreshold: SHARD_SPLIT_THRESHOLD
        }),
        collect(cb)
      ),
      (imported, cb) => {
        directory = new CID(imported.pop().multihash)

        // store the CIDs, we will validate them later
        imported.forEach(imported => {
          files[imported.path].cid = new CID(imported.multihash)
        })

        ipld.get(directory, cb)
      },
      ({ value, cid }, cb) => {
        const dir = UnixFS.unmarshal(value.data)

        expect(dir.type).to.equal('hamt-sharded-directory')

        pull(
          exporter(directory, ipld),
          collect(cb)
        )
      },
      (exported, cb) => {
        const dir = exported.shift()

        expect(dir.cid.equals(directory)).to.be.true()
        expect(exported.length).to.equal(Object.keys(files).length)

        parallel(
          exported.map(exported => (cb) => {
            pull(
              exported.content,
              collect((err, bufs) => {
                if (err) {
                  cb(err)
                }

                // validate the CID
                expect(files[exported.name].cid.equals(exported.cid)).to.be.true()

                // validate the exported file content
                expect(files[exported.name].content).to.deep.equal(bufs[0])

                cb()
              })
            )
          }),
          cb
        )
      }
    ], done)
  })

  it('exports all the files from a sharded directory with maxDepth', (done) => {
    const files = {}
    let dirCid

    for (let i = 0; i < (SHARD_SPLIT_THRESHOLD + 1); i++) {
      files[`file-${Math.random()}.txt`] = {
        content: randomBytes(100)
      }
    }

    waterfall([
      (cb) => pull(
        pull.values(
          Object.keys(files).map(path => ({
            path,
            content: files[path].content
          }))
        ),
        importer(ipld, {
          wrap: true,
          shardSplitThreshold: SHARD_SPLIT_THRESHOLD
        }),
        collect(cb)
      ),
      (imported, cb) => {
        dirCid = new CID(imported.pop().multihash)

        pull(
          exporter(dirCid, ipld, {
            maxDepth: 1
          }),
          collect(cb)
        )
      },
      (exported, cb) => {
        const dir = exported.shift()

        expect(dir.cid.equals(dirCid)).to.be.true()
        expect(exported.length).to.equal(Object.keys(files).length)

        cb()
      }
    ], done)
  })

  it('exports all files from a sharded directory with subshards', (done) => {
    waterfall([
      (cb) => createShard(31, cb),
      (dir, cb) => {
        pull(
          exporter(`/ipfs/${dir.toBaseEncodedString()}`, ipld),
          collect(cb)
        )
      },
      (exported, cb) => {
        expect(exported.length).to.equal(32)

        const dir = exported.shift()

        expect(dir.type).to.equal('dir')

        exported.forEach(file => expect(file.type).to.equal('file'))

        cb()
      }
    ], done)
  })

  it('exports one file from a sharded directory', (done) => {
    waterfall([
      (cb) => createShard(31, cb),
      (dir, cb) => {
        pull(
          exporter(`/ipfs/${dir.toBaseEncodedString()}/file-14`, ipld),
          collect(cb)
        )
      },
      (exported, cb) => {
        expect(exported.length).to.equal(1)

        const file = exported.shift()

        expect(file.name).to.deep.equal('file-14')

        cb()
      }
    ], done)
  })

  it('exports one file from a sharded directory sub shard', (done) => {
    waterfall([
      (cb) => createShard(31, cb),
      (dir, cb) => {
        pull(
          exporter(`/ipfs/${dir.toBaseEncodedString()}/file-30`, ipld),
          collect(cb)
        )
      },
      (exported, cb) => {
        expect(exported.length).to.equal(1)

        const file = exported.shift()

        expect(file.name).to.deep.equal('file-30')

        cb()
      }
    ], done)
  })

  it('exports one file from a shard inside a shard inside a shard', (done) => {
    waterfall([
      (cb) => createShard(2568, cb),
      (dir, cb) => {
        pull(
          exporter(`/ipfs/${dir.toBaseEncodedString()}/file-2567`, ipld),
          collect(cb)
        )
      },
      (exported, cb) => {
        expect(exported.length).to.equal(1)

        const file = exported.shift()

        expect(file.name).to.deep.equal('file-2567')

        cb()
      }
    ], done)
  })

  it('uses maxDepth to only extract a deep folder from the sharded directory', (done) => {
    waterfall([
      (cb) => createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`, cb),
      (dir, cb) => {
        pull(
          exporter(`/ipfs/${dir.toBaseEncodedString()}/foo/bar/baz`, ipld, {
            maxDepth: 3
          }),
          collect(cb)
        )
      },
      (exported, cb) => {
        expect(exported.length).to.equal(1)

        const entry = exported.pop()

        expect(entry.name).to.deep.equal('baz')

        cb()
      }
    ], done)
  })

  it('uses maxDepth to only extract an intermediate folder from the sharded directory', (done) => {
    waterfall([
      (cb) => createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`, cb),
      (dir, cb) => {
        pull(
          exporter(`/ipfs/${dir.toBaseEncodedString()}/foo/bar/baz`, ipld, {
            maxDepth: 2
          }),
          collect(cb)
        )
      },
      (exported, cb) => {
        expect(exported.length).to.equal(1)

        const entry = exported.pop()

        expect(entry.name).to.deep.equal('bar')

        cb()
      }
    ], done)
  })

  it('uses fullPath extract all intermediate entries from the sharded directory', (done) => {
    waterfall([
      (cb) => createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`, cb),
      (dir, cb) => {
        pull(
          exporter(`/ipfs/${dir.toBaseEncodedString()}/foo/bar/baz/file-1`, ipld, {
            fullPath: true
          }),
          collect(cb)
        )
      },
      (exported, cb) => {
        expect(exported.length).to.equal(5)

        expect(exported[1].name).to.equal('foo')
        expect(exported[2].name).to.equal('bar')
        expect(exported[3].name).to.equal('baz')
        expect(exported[4].name).to.equal('file-1')

        cb()
      }
    ], done)
  })

  it('uses fullPath extract all intermediate entries from the sharded directory as well as the contents', (done) => {
    waterfall([
      (cb) => createShardWithFileNames(31, (index) => `/foo/bar/baz/file-${index}`, cb),
      (dir, cb) => {
        pull(
          exporter(`/ipfs/${dir.toBaseEncodedString()}/foo/bar/baz`, ipld, {
            fullPath: true
          }),
          collect(cb)
        )
      },
      (exported, cb) => {
        expect(exported.length).to.equal(35)

        expect(exported[1].name).to.equal('foo')
        expect(exported[2].name).to.equal('bar')
        expect(exported[3].name).to.equal('baz')
        expect(exported[4].name).to.equal('file-14')

        exported.slice(4).forEach(file => expect(file.type).to.equal('file'))

        cb()
      }
    ], done)
  })

  it('exports a file from a sharded directory inside a regular directory inside a sharded directory', (done) => {
    waterfall([
      (cb) => createShard(15, cb),
      (dir, cb) => {
        DAGNode.create(new UnixFS('directory').marshal(), [
          new DAGLink('shard', 5, dir)
        ], cb)
      },
      (node, cb) => {
        ipld.put(node, {
          version: 0,
          format: 'dag-pb',
          hashAlg: 'sha2-256'
        }, cb)
      },
      (cid, cb) => {
        DAGNode.create(new UnixFS('hamt-sharded-directory').marshal(), [
          new DAGLink('75normal-dir', 5, cid)
        ], cb)
      },
      (node, cb) => {
        ipld.put(node, {
          version: 1,
          format: 'dag-pb',
          hashAlg: 'sha2-256'
        }, cb)
      },
      (dir, cb) => {
        pull(
          exporter(`/ipfs/${dir.toBaseEncodedString()}/normal-dir/shard/file-1`, ipld),
          collect(cb)
        )
      },
      (exported, cb) => {
        expect(exported.length).to.equal(1)

        const entry = exported.pop()

        expect(entry.name).to.deep.equal('file-1')

        cb()
      }
    ], done)
  })
})
