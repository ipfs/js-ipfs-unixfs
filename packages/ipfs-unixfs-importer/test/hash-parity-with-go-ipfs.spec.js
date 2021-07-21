/* eslint-env mocha */
import { importer } from '../src/index.js'

// @ts-ignore needs types properly fixed
import { expect } from 'aegir/utils/chai.js'
import randomByteStream from './helpers/finite-pseudorandom-byte-stream.js'
import first from 'it-first'
import blockApi from './helpers/block.js'
import defaultOptions from '../src/options.js'

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
