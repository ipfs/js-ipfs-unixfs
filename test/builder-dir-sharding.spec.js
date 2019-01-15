/* eslint-env mocha */
'use strict'

const importer = require('../src')
const exporter = require('ipfs-unixfs-exporter')

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const asyncMap = require('pull-stream/throughs/async-map')
const collect = require('pull-stream/sinks/collect')
const pushable = require('pull-pushable')
const whilst = require('async/whilst')
const setImmediate = require('async/setImmediate')
const leftPad = require('left-pad')
const CID = require('cids')

describe('builder: directory sharding', () => {
  let ipld

  before((done) => {
    IPLD.inMemory((err, resolver) => {
      expect(err).to.not.exist()

      ipld = resolver

      done()
    })
  })

  describe('basic dirbuilder', () => {
    let nonShardedHash, shardedHash

    it('yields a non-sharded dir', (done) => {
      const options = {
        shardSplitThreshold: Infinity // never shard
      }

      pull(
        values([
          {
            path: 'a/b',
            content: values([Buffer.from('i have the best bytes')])
          }
        ]),
        importer(ipld, options),
        collect((err, nodes) => {
          try {
            expect(err).to.not.exist()
            expect(nodes.length).to.be.eql(2)
            expect(nodes[0].path).to.be.eql('a/b')
            expect(nodes[1].path).to.be.eql('a')
            nonShardedHash = nodes[1].multihash
            expect(nonShardedHash).to.exist()
            done()
          } catch (err) {
            done(err)
          }
        })
      )
    })

    it('yields a sharded dir', (done) => {
      const options = {
        shardSplitThreshold: 0 // always shard
      }

      pull(
        values([
          {
            path: 'a/b',
            content: values([Buffer.from('i have the best bytes')])
          }
        ]),
        importer(ipld, options),
        collect((err, nodes) => {
          try {
            expect(err).to.not.exist()
            expect(nodes.length).to.be.eql(2)
            expect(nodes[0].path).to.be.eql('a/b')
            expect(nodes[1].path).to.be.eql('a')
            shardedHash = nodes[1].multihash
            // hashes are different
            expect(shardedHash).to.not.equal(nonShardedHash)
            done()
          } catch (err) {
            done(err)
          }
        })
      )
    })

    it('exporting unsharded hash results in the correct files', (done) => {
      pull(
        exporter(nonShardedHash, ipld),
        collect((err, nodes) => {
          try {
            expect(err).to.not.exist()
            expect(nodes.length).to.be.eql(2)
            const expectedHash = new CID(nonShardedHash).toBaseEncodedString()
            expect(nodes[0].path).to.be.eql(expectedHash)
            expect(new CID(nodes[0].hash).toBaseEncodedString()).to.be.eql(expectedHash)
            expect(nodes[1].path).to.be.eql(expectedHash + '/b')
            expect(nodes[1].size).to.be.eql(29)
          } catch (err) {
            return done(err)
          }

          pull(
            nodes[1].content,
            collect(collected)
          )
        })
      )

      function collected (err, content) {
        try {
          expect(err).to.not.exist()
          expect(content.length).to.be.eql(1)
          expect(content[0].toString()).to.be.eql('i have the best bytes')
          done()
        } catch (err) {
          done(err)
        }
      }
    })

    it('exporting sharded hash results in the correct files', (done) => {
      pull(
        exporter(shardedHash, ipld),
        collect((err, nodes) => {
          try {
            expect(err).to.not.exist()
            expect(nodes.length).to.be.eql(2)
            const expectedHash = new CID(shardedHash).toBaseEncodedString()
            expect(nodes[0].path).to.be.eql(expectedHash)
            expect(new CID(nodes[0].hash).toBaseEncodedString()).to.be.eql(expectedHash)
            expect(nodes[1].path).to.be.eql(expectedHash + '/b')
            expect(nodes[1].size).to.be.eql(21)
          } catch (err) {
            return done(err)
          }

          pull(
            nodes[1].content,
            collect(collected)
          )
        })
      )

      function collected (err, content) {
        try {
          expect(err).to.not.exist()
          expect(content.length).to.be.eql(1)
          expect(content[0].toString()).to.be.eql('i have the best bytes')
          done()
        } catch (err) {
          done(err)
        }
      }
    })
  })

  describe('big dir', function () {
    this.timeout(30 * 1000)

    const maxDirs = 2000
    let rootHash

    it('imports a big dir', (done) => {
      const push = pushable()
      pull(
        push,
        importer(ipld),
        collect((err, nodes) => {
          try {
            expect(err).to.not.exist()
            expect(nodes.length).to.be.eql(maxDirs + 1)
            const last = nodes[nodes.length - 1]
            expect(last.path).to.be.eql('big')
            rootHash = last.multihash
            done()
          } catch (err) {
            done(err)
          }
        })
      )

      let pending = maxDirs
      let i = 0

      whilst(
        () => pending,
        (callback) => {
          pending--
          i++
          const pushable = {
            path: 'big/' + leftPad(i.toString(), 4, '0'),
            content: values([Buffer.from(i.toString())])
          }
          push.push(pushable)
          setImmediate(callback)
        },
        (err) => {
          expect(err).to.not.exist()
          push.end()
        }
      )
    })

    it('exports a big dir', (done) => {
      const contentEntries = []
      const entries = {}
      pull(
        exporter(rootHash, ipld),
        asyncMap((node, callback) => {
          if (node.content) {
            pull(
              node.content,
              collect(collected)
            )
          } else {
            entries[node.path] = node
            callback()
          }

          function collected (err, content) {
            expect(err).to.not.exist()
            entries[node.path] = { content: content.toString() }
            callback(null, node)
          }
        }),
        collect((err, nodes) => {
          expect(err).to.not.exist()
          const paths = Object.keys(entries).sort()
          expect(paths.length).to.be.eql(2001)
          paths.forEach(eachPath)
          done()
        })
      )

      function eachPath (path, index) {
        if (!index) {
          // first dir
          expect(path).to.be.eql(new CID(rootHash).toBaseEncodedString())
          const entry = entries[path]
          expect(entry).to.exist()
          expect(entry.content).to.not.exist()
          return
        }
        // dir entries
        const content = entries[path] && entries[path].content
        if (content) {
          expect(content).to.be.eql(index.toString())
          contentEntries.push(path)
        }
      }
    })
  })

  describe('big nested dir', function () {
    this.timeout(450 * 1000)

    const maxDirs = 2000
    const maxDepth = 3
    let rootHash

    it('imports a big dir', (done) => {
      const push = pushable()
      pull(
        push,
        importer(ipld),
        collect((err, nodes) => {
          expect(err).to.not.exist()
          const last = nodes[nodes.length - 1]
          expect(last.path).to.be.eql('big')
          rootHash = last.multihash
          done()
        })
      )

      let pending = maxDirs
      let pendingDepth = maxDepth
      let i = 0
      let depth = 1

      whilst(
        () => pendingDepth && pending,
        (callback) => {
          i++
          const dir = []
          for (let d = 0; d < depth; d++) {
            dir.push('big')
          }
          const pushed = {
            path: dir.concat(leftPad(i.toString(), 4, '0')).join('/'),
            content: values([Buffer.from(i.toString())])
          }
          push.push(pushed)
          pending--
          if (!pending) {
            pendingDepth--
            pending = maxDirs
            i = 0
            depth++
          }
          setImmediate(callback)
        },
        (err) => {
          expect(err).to.not.exist()
          push.end()
        }
      )
    })

    it('exports a big dir', (done) => {
      const entries = {}
      pull(
        exporter(rootHash, ipld),
        asyncMap((node, callback) => {
          if (node.content) {
            pull(
              node.content,
              collect(collected)
            )
          } else {
            entries[node.path] = node
            callback()
          }

          function collected (err, content) {
            expect(err).to.not.exist()
            entries[node.path] = { content: content.toString() }
            callback(null, node)
          }
        }),
        collect(collected)
      )

      function collected (err, nodes) {
        expect(err).to.not.exist()
        const paths = Object.keys(entries).sort()
        expect(paths.length).to.be.eql(maxDepth * maxDirs + maxDepth)
        let index = 0
        let depth = 1
        paths.forEach(eachPath)
        done()

        function eachPath (path) {
          if (!index) {
            // first dir
            if (depth === 1) {
              expect(path).to.be.eql(new CID(rootHash).toBaseEncodedString())
            }
            const entry = entries[path]
            expect(entry).to.exist()
            expect(entry.content).to.not.exist()
          } else {
            // dir entries
            const pathElements = path.split('/')
            expect(pathElements.length).to.be.eql(depth + 1)
            const lastElement = pathElements[pathElements.length - 1]
            expect(lastElement).to.be.eql(leftPad(index.toString(), 4, '0'))
            expect(entries[path].content).to.be.eql(index.toString())
          }
          index++
          if (index > maxDirs) {
            index = 0
            depth++
          }
        }
      }
    })

    it('exports a big dir with subpath', (done) => {
      const exportHash = new CID(rootHash).toBaseEncodedString() + '/big/big/2000'
      pull(
        exporter(exportHash, ipld),
        collect(collected)
      )

      function collected (err, nodes) {
        expect(err).to.not.exist()
        expect(nodes.length).to.equal(1)
        expect(nodes.map((node) => node.path)).to.deep.equal([
          '2000'
        ])
        pull(
          nodes[0].content,
          collect((err, content) => {
            expect(err).to.not.exist()
            expect(content.toString()).to.equal('2000')
            done()
          })
        )
      }
    })
  })
})
