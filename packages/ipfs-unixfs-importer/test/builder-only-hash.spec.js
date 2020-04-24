/* eslint-env mocha */
'use strict'

const { Buffer } = require('buffer')
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const builder = require('../src/dag-builder')
const all = require('it-all')
const blockApi = require('./helpers/block')

describe('builder: onlyHash', () => {
  let ipld
  let block

  before(async () => {
    ipld = await inMemory(IPLD)
    block = blockApi(ipld)
  })

  it('will only chunk and hash if passed an "onlyHash" option', async () => {
    const nodes = await all(builder([{
      path: 'foo.txt',
      content: Buffer.from([0, 1, 2, 3, 4])
    }], block, {
      onlyHash: true,
      chunker: 'fixed',
      strategy: 'balanced',
      progress: () => {},
      leafType: 'file',
      reduceSingleLeafToSelf: true,
      format: 'dag-pb',
      hashAlg: 'sha2-256',
      wrap: true,
      maxChunkSize: 1024,
      maxChildrenPerNode: 254
    }))

    expect(nodes.length).to.equal(1)

    try {
      await ipld.get((await nodes[0]()).cid)

      throw new Error('Should have errored')
    } catch (err) {
      expect(err.code).to.equal('ERR_NOT_FOUND')
    }
  })
})
