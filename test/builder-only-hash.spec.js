/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const builder = require('../src/dag-builder')
const all = require('async-iterator-all')

describe('builder: onlyHash', () => {
  let ipld

  before((done) => {
    inMemory(IPLD, (err, resolver) => {
      expect(err).to.not.exist()

      ipld = resolver

      done()
    })
  })

  it('will only chunk and hash if passed an "onlyHash" option', async () => {
    const nodes = await all(builder([{
      path: 'foo.txt',
      content: Buffer.from([0, 1, 2, 3, 4])
    }], ipld, {
      onlyHash: true,
      chunker: 'fixed',
      strategy: 'balanced',
      progress: () => {},
      leafType: 'file',
      reduceSingleLeafToSelf: true,
      format: 'dag-pb',
      hashAlg: 'sha2-256',
      wrap: true,
      chunkerOptions: {
        maxChunkSize: 1024
      },
      builderOptions: {
        maxChildrenPerNode: 254
      }
    }))

    expect(nodes.length).to.equal(1)

    try {
      await ipld.get(nodes[0].cid)

      throw new Error('Should have errored')
    } catch (err) {
      expect(err.code).to.equal('ERR_NOT_FOUND')
    }
  })
})
