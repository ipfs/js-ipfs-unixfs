/* eslint-env mocha */
'use strict'

const importer = require('../src')

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const randomByteStream = require('./helpers/finite-pseudorandom-byte-stream')
const first = require('it-first')
const blockApi = require('./helpers/block')

const strategies = [
  'flat',
  'trickle',
  'balanced'
]

const expectedHashes = {
  flat: 'QmeJ9FRWKnXZQiX5CM1E8j4gpGbg6otpgajThqsbnBpoyD',
  balanced: 'QmRdPboiJQoZ5cdazR9a8vGqdJvWg6M5bfdtUSKNHpuscj',
  trickle: 'QmdZcefqMZ3tzdS4CRBN5s1c67eS3nQzN8TNXFBYfgofoy'
}

strategies.forEach(strategy => {
  const options = {
    strategy: strategy
  }

  describe('go-ipfs interop using importer:' + strategy, () => {
    let ipld
    let block

    before(async () => {
      ipld = await inMemory(IPLD)
      block = blockApi(ipld)
    })

    it('yields the same tree as go-ipfs', async function () {
      this.timeout(100 * 1000)

      const source = [{
        path: 'big.dat',
        content: randomByteStream(45900000, 7382)
      }]

      const file = await first(importer(source, block, options))

      expect(file.cid.toBaseEncodedString()).to.be.equal(expectedHashes[strategy])
    })
  })
})
