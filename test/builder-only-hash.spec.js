/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const collect = require('pull-stream/sinks/collect')
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const CID = require('cids')
const createBuilder = require('../src/builder')
const FixedSizeChunker = require('../src/chunker/fixed-size')

describe('builder: onlyHash', () => {
  let ipld

  before((done) => {
    inMemory(IPLD, (err, resolver) => {
      expect(err).to.not.exist()

      ipld = resolver

      done()
    })
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
      values([inputFile]),
      createBuilder(FixedSizeChunker, ipld, options),
      collect(onCollected)
    )
  })
})
