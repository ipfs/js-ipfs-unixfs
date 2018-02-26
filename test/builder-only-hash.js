/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const BlockService = require('ipfs-block-service')
const pull = require('pull-stream')
const Ipld = require('ipld')
const CID = require('cids')
const createBuilder = require('../src/builder')
const FixedSizeChunker = require('../src/chunker/fixed-size')

module.exports = (repo) => {
  describe('builder: onlyHash', () => {
    let ipld

    before(() => {
      const bs = new BlockService(repo)
      ipld = new Ipld(bs)
    })

    it('will only chunk and hash if passed an "onlyHash" option', (done) => {
      const onCollected = (err, nodes) => {
        if (err) return done(err)

        const node = nodes[0]
        expect(node).to.exist()

        ipld.get(new CID(node.multihash), (err, res) => {
          expect(err).to.exist()
          done()
        })
      }

      const content = String(Math.random() + Date.now())
      const inputFile = {
        path: content + '.txt',
        content: Buffer.from(content)
      }

      const options = {
        onlyHash: true
      }

      pull(
        pull.values([inputFile]),
        createBuilder(FixedSizeChunker, ipld, options),
        pull.collect(onCollected)
      )
    })
  })
}
