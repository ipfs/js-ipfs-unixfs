/* eslint-env mocha */
'use strict'

const importer = require('../src')

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const randomByteStream = require('./helpers/finite-pseudorandom-byte-stream')
const first = require('async-iterator-first')

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

    before((done) => {
      inMemory(IPLD, (err, resolver) => {
        expect(err).to.not.exist()

        ipld = resolver

        done()
      })
    })

    it('yields the same tree as go-ipfs', async function () {
      this.timeout(10 * 1000)

      const source = [{
        path: 'big.dat',
        content: randomByteStream(45900000, 7382)
      }]

      const file = await first(importer(source, ipld, options))

      expect(file.cid.toBaseEncodedString()).to.be.equal(expectedHashes[strategy])
    })
  })
})
