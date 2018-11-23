/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const UnixFS = require('ipfs-unixfs')
const pull = require('pull-stream')
const CID = require('cids')
const waterfall = require('async/waterfall')
const parallel = require('async/parallel')
const randomBytes = require('./helpers/random-bytes')

const exporter = require('../src')
const importer = require('ipfs-unixfs-importer')

const SHARD_SPLIT_THRESHOLD = 10

describe('exporter sharded', function () {
  this.timeout(30000)

  let ipld

  before((done) => {
    IPLD.inMemory((err, resolver) => {
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
        pull.collect(cb)
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
          pull.collect(cb)
        )
      },
      (exported, cb) => {
        const dir = exported.shift()

        expect(dir.hash).to.deep.equal(directory.buffer)
        expect(exported.length).to.equal(Object.keys(files).length)

        parallel(
          exported.map(exported => (cb) => {
            pull(
              exported.content,
              pull.collect((err, bufs) => {
                if (err) {
                  cb(err)
                }

                // validate the CID
                expect(files[exported.name].cid.buffer).to.deep.equal(exported.hash)

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
          wrap: true
        }),
        pull.collect(cb)
      ),
      (imported, cb) => {
        dirCid = new CID(imported.pop().multihash)

        pull(
          exporter(dirCid, ipld, {
            maxDepth: 1
          }),
          pull.collect(cb)
        )
      },
      (exported, cb) => {
        const dir = exported.shift()

        expect(dir.hash).to.deep.equal(dirCid.buffer)
        expect(exported.length).to.equal(Object.keys(files).length)

        cb()
      }
    ], done)
  })
})
