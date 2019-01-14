/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const collect = require('pull-stream/sinks/collect')
const map = require('async/map')
const CID = require('cids')

const importer = require('../src')
const exporter = require('ipfs-unixfs-exporter')

describe('import and export: directory', () => {
  const rootHash = 'QmdCrquDwd7RfZ6GCZFEVADwe8uyyw1YmF9mtAB7etDgmK'
  let ipld

  before((done) => {
    inMemory(IPLD, (err, resolver) => {
      expect(err).to.not.exist()

      ipld = resolver

      done()
    })
  })

  it('imports', function (done) {
    this.timeout(20 * 1000)

    pull(
      values([
        { path: 'a/b/c/d/e', content: values([Buffer.from('banana')]) },
        { path: 'a/b/c/d/f', content: values([Buffer.from('strawberry')]) },
        { path: 'a/b/g', content: values([Buffer.from('ice')]) },
        { path: 'a/b/h', content: values([Buffer.from('cream')]) }
      ]),
      importer(ipld),
      collect((err, files) => {
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

  it('exports', function (done) {
    this.timeout(20 * 1000)

    pull(
      exporter(rootHash, ipld),
      collect((err, files) => {
        expect(err).to.not.exist()
        map(
          files,
          (file, callback) => {
            if (file.content) {
              pull(
                file.content,
                collect(mapFile(file, callback))
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

function normalizeNode (node) {
  return {
    path: node.path,
    multihash: new CID(node.multihash).toBaseEncodedString()
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
