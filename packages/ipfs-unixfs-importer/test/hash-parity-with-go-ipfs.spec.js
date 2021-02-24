/* eslint-env mocha */
'use strict'

const { importer } = require('../src')

const { expect } = require('aegir/utils/chai')
const randomByteStream = require('./helpers/finite-pseudorandom-byte-stream')
const first = require('it-first')
const blockApi = require('./helpers/block')
const defaultOptions = require('../src/options')

/** @type {('flat' | 'trickle' | 'balanced')[]} */
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
    ...defaultOptions(),
    strategy: strategy
  }

  if (strategy === 'trickle') {
    // replicate go-ipfs behaviour
    options.leafType = 'raw'
    options.reduceSingleLeafToSelf = false
  }

  describe('go-ipfs interop using importer:' + strategy, () => {
    /** @type {import('../src').BlockAPI} */
    const block = blockApi()

    it('yields the same tree as go-ipfs', async function () {
      this.timeout(100 * 1000)

      const source = [{
        path: 'big.dat',
        content: randomByteStream(45900000, 7382)
      }]

      const file = await first(importer(source, block, options))

      if (!file) {
        throw new Error('Nothing imported')
      }

      expect(file.cid.toString()).to.be.equal(expectedHashes[strategy])
    })
  })
})
