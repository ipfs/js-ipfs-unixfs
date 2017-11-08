/* eslint-env mocha */
'use strict'

const importer = require('./../src').importer
const exporter = require('./../src').exporter

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const mh = require('multihashes')
const BlockService = require('ipfs-block-service')
const IPLDResolver = require('ipld-resolver')
const pull = require('pull-stream')
const pushable = require('pull-pushable')
const whilst = require('async/whilst')
const setImmediate = require('async/setImmediate')
const leftPad = require('left-pad')

module.exports = (repo) => {
  describe('builder: directory sharding', function () {
    this.timeout(20 * 1000)

    let ipldResolver

    before(() => {
      const bs = new BlockService(repo)
      ipldResolver = new IPLDResolver(bs)
    })

    describe('basic dirbuilder', () => {
      let nonShardedHash, shardedHash

      it('yields a non-sharded dir', (done) => {
        const options = {
          shardSplitThreshold: Infinity // never shard
        }

        pull(
          pull.values([
            {
              path: 'a/b',
              content: pull.values([Buffer.from('i have the best bytes')])
            }
          ]),
          importer(ipldResolver, options),
          pull.collect((err, nodes) => {
            expect(err).to.not.exist()
            expect(nodes.length).to.be.eql(2)
            expect(nodes[0].path).to.be.eql('a/b')
            expect(nodes[1].path).to.be.eql('a')
            nonShardedHash = nodes[1].multihash
            expect(nonShardedHash).to.exist()
            done()
          })
        )
      })

      it('yields a sharded dir', (done) => {
        const options = {
          shardSplitThreshold: 0 // always shard
        }

        pull(
          pull.values([
            {
              path: 'a/b',
              content: pull.values([Buffer.from('i have the best bytes')])
            }
          ]),
          importer(ipldResolver, options),
          pull.collect((err, nodes) => {
            expect(err).to.not.exist()
            expect(nodes.length).to.be.eql(2)
            expect(nodes[0].path).to.be.eql('a/b')
            expect(nodes[1].path).to.be.eql('a')
            shardedHash = nodes[1].multihash
            // hashes are different
            expect(shardedHash).to.not.equal(nonShardedHash)
            done()
          })
        )
      })

      it('exporting unsharded hash results in the correct files', (done) => {
        pull(
          exporter(nonShardedHash, ipldResolver),
          pull.collect((err, nodes) => {
            expect(err).to.not.exist()
            expect(nodes.length).to.be.eql(2)
            const expectedHash = mh.toB58String(nonShardedHash)
            expect(nodes[0].path).to.be.eql(expectedHash)
            expect(mh.toB58String(nodes[0].hash)).to.be.eql(expectedHash)
            expect(nodes[1].path).to.be.eql(expectedHash + '/b')
            expect(nodes[1].size).to.be.eql(21)
            pull(
              nodes[1].content,
              pull.collect(collected)
            )
          })
        )

        function collected (err, content) {
          expect(err).to.not.exist()
          expect(content.length).to.be.eql(1)
          expect(content[0].toString()).to.be.eql('i have the best bytes')
          done()
        }
      })

      it('exporting sharded hash results in the correct files', (done) => {
        pull(
          exporter(shardedHash, ipldResolver),
          pull.collect((err, nodes) => {
            expect(err).to.not.exist()
            expect(nodes.length).to.be.eql(2)
            const expectedHash = mh.toB58String(shardedHash)
            expect(nodes[0].path).to.be.eql(expectedHash)
            expect(nodes[0].hash).to.be.eql(expectedHash)
            expect(nodes[1].path).to.be.eql(expectedHash + '/b')
            expect(nodes[1].size).to.be.eql(21)
            pull(
              nodes[1].content,
              pull.collect(collected)
            )
          })
        )

        function collected (err, content) {
          expect(err).to.not.exist()
          expect(content.length).to.be.eql(1)
          expect(content[0].toString()).to.be.eql('i have the best bytes')
          done()
        }
      })
    })

    describe('big dir', () => {
      const maxDirs = 2000
      let rootHash

      it('imports a big dir', (done) => {
        const push = pushable()
        pull(
          push,
          importer(ipldResolver),
          pull.collect((err, nodes) => {
            expect(err).to.not.exist()
            expect(nodes.length).to.be.eql(maxDirs + 1)
            const last = nodes[nodes.length - 1]
            expect(last.path).to.be.eql('big')
            rootHash = last.multihash
            done()
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
              content: pull.values([Buffer.from(i.toString())])
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
          exporter(rootHash, ipldResolver),
          pull.asyncMap((node, callback) => {
            if (node.content) {
              pull(
                node.content,
                pull.collect(collected)
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
          pull.collect((err, nodes) => {
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
            expect(path).to.be.eql(mh.toB58String(rootHash))
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

    describe('big nested dir', () => {
      const maxDirs = 2000
      const maxDepth = 3
      let rootHash

      it('imports a big dir', (done) => {
        const push = pushable()
        pull(
          push,
          importer(ipldResolver),
          pull.collect((err, nodes) => {
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
              content: pull.values([Buffer.from(i.toString())])
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
          exporter(rootHash, ipldResolver),
          pull.asyncMap((node, callback) => {
            if (node.content) {
              pull(
                node.content,
                pull.collect(collected)
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
          pull.collect(collected)
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
                expect(path).to.be.eql(mh.toB58String(rootHash))
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
        const exportHash = mh.toB58String(rootHash) + '/big/big/2000'
        pull(
          exporter(exportHash, ipldResolver),
          pull.collect(collected)
        )

        function collected (err, nodes) {
          expect(err).to.not.exist()
          expect(nodes.length).to.equal(1)
          expect(nodes.map((node) => node.path)).to.deep.equal([
            '2000'
          ])
          pull(
            nodes[0].content,
            pull.collect((err, content) => {
              expect(err).to.not.exist()
              expect(content.toString()).to.equal('2000')
              done()
            })
          )
        }
      })
    })
  })
}
