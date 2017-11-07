/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const BlockService = require('ipfs-block-service')
const IPLDResolver = require('ipld-resolver')
const pull = require('pull-stream')
const mh = require('multihashes')
const map = require('async/map')

const unixFSEngine = require('./../')

module.exports = (repo) => {
  describe('import adn export big nested dir', () => {
    const rootHash = 'QmdCrquDwd7RfZ6GCZFEVADwe8uyyw1YmF9mtAB7etDgmK'
    let ipldResolver

    before(() => {
      const bs = new BlockService(repo)
      ipldResolver = new IPLDResolver(bs)
    })

    it('imports', (done) => {
      pull(
        pull.values([
          { path: 'a/b/c/d/e', content: pull.values([Buffer.from('banana')]) },
          { path: 'a/b/c/d/f', content: pull.values([Buffer.from('strawberry')]) },
          { path: 'a/b/g', content: pull.values([Buffer.from('ice')]) },
          { path: 'a/b/h', content: pull.values([Buffer.from('cream')]) }
        ]),
        unixFSEngine.importer(ipldResolver),
        pull.collect((err, files) => {
          expect(err).to.not.exist()
          expect(files.map(normalizeNode).sort(byPath)).to.be.eql([
            { path: 'a/b/h',
              multihash: 'QmWHMpCtdNjemT2F3SjyrmnBXQXwEohaZd4apcbFBhbFRC' },
            { path: 'a/b/g',
              multihash: 'QmQGwYzzTPcbqTiy2Nbp88gqqBqCWY4QZGfen45LFZkD5n' },
            { path: 'a/b/c/d/f',
              multihash: 'QmNVHs2dy7AjGUotsubWVncRsD3SpRXm8MgmCCQTVdVACz' },
            { path: 'a/b/c/d/e',
              multihash: 'QmYPbDKwc7oneCcEc6BcRSN5GXthTGWUCd19bTCyP9u3vH' },
            { path: 'a/b/c/d',
              multihash: 'QmQGDXr3ysARM38n7h79Tx7yD3YxuzcnZ1naG71WMojPoj' },
            { path: 'a/b/c',
              multihash: 'QmYTVcjYpN3hQLtJstCPE8hhEacAYjWAuTmmAAXoonamuE' },
            { path: 'a/b',
              multihash: 'QmWyWYxq1GD9fEyckf5LrJv8hMW35CwfWwzDBp8bTw3NQj' },
            { path: 'a',
              multihash: rootHash }
          ])
          done()
        })
      )
    })

    it('exports', done => {
      pull(
        unixFSEngine.exporter(rootHash, ipldResolver),
        pull.collect((err, files) => {
          expect(err).to.not.exist()
          map(
            files,
            (file, callback) => {
              if (file.content) {
                pull(
                  file.content,
                  pull.collect(mapFile(file, callback))
                )
              } else {
                callback(null, { path: file.path })
              }
            },
            (err, files) => {
              expect(err).to.not.exist()
              expect(files.filter(fileHasContent).sort(byPath)).to.eql([
                { path: 'QmdCrquDwd7RfZ6GCZFEVADwe8uyyw1YmF9mtAB7etDgmK/b/h',
                  content: 'cream' },
                { path: 'QmdCrquDwd7RfZ6GCZFEVADwe8uyyw1YmF9mtAB7etDgmK/b/g',
                  content: 'ice' },
                { path: 'QmdCrquDwd7RfZ6GCZFEVADwe8uyyw1YmF9mtAB7etDgmK/b/c/d/f',
                  content: 'strawberry' },
                { path: 'QmdCrquDwd7RfZ6GCZFEVADwe8uyyw1YmF9mtAB7etDgmK/b/c/d/e',
                  content: 'banana' }
              ])
              done()
            })
        })
      )

      function mapFile (file, callback) {
        return (err, fileContent) => {
          callback(err, fileContent && {
            path: file.path,
            content: fileContent.toString()
          })
        }
      }
    })
  })
}

function normalizeNode (node) {
  return {
    path: node.path,
    multihash: mh.toB58String(node.multihash)
  }
}

function fileHasContent (file) {
  return Boolean(file.content)
}

function byPath (a, b) {
  if (a.path > b.path) return -1
  if (a.path < b.path) return 1
  return 0
}
