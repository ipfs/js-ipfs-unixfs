/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import first from 'it-first'
import last from 'it-last'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { importer, type ImporterOptions } from '../src/index.js'
import { balanced, type FileLayout, flat, trickle } from '../src/layout/index.js'
import randomByteStream from './helpers/finite-pseudorandom-byte-stream.js'

const strategies: Record<'flat' | 'trickle' | 'balanced', FileLayout> = {
  flat: flat(),
  trickle: trickle(),
  balanced: balanced()
}

const expectedHashes: Record<string, string> = {
  flat: 'QmeJ9FRWKnXZQiX5CM1E8j4gpGbg6otpgajThqsbnBpoyD',
  balanced: 'QmRdPboiJQoZ5cdazR9a8vGqdJvWg6M5bfdtUSKNHpuscj',
  trickle: 'QmdZcefqMZ3tzdS4CRBN5s1c67eS3nQzN8TNXFBYfgofoy'
}

Object.entries(strategies).forEach(([strategy, layout]) => {
  const options: Partial<ImporterOptions> = {
    layout,
    cidVersion: 0,
    rawLeaves: false
  }

  if (strategy === 'trickle') {
    // replicate go-ipfs behaviour
    options.leafType = 'raw'
    options.reduceSingleLeafToSelf = false
  }

  describe('go-ipfs interop using importer:' + strategy, () => {
    const block = new MemoryBlockstore()

    it('yields the same tree as go-ipfs', async function () {
      this.timeout(100 * 1000)

      const source = [{
        path: 'big.dat',
        content: randomByteStream(45900000, 7382)
      }]

      const file = await first(importer(source, block, options))

      if (file == null) {
        throw new Error('Nothing imported')
      }

      expect(file.cid.toString()).to.be.equal(expectedHashes[strategy])
    })
  })
})

describe('go-ipfs auto-sharding interop', function () {
  this.timeout(100 * 1000)

  function buildSource (count: number): Array<{ path: string, content: Uint8Array }> {
    return new Array(count).fill(0).map((_, index) => {
      const string = `long name to fill out bytes to make the sharded directory test flip over the sharded directory limit because link names are included in the directory entry ${index}`

      return {
        path: `rootDir/${string}`,
        content: uint8ArrayFromString(string)
      }
    })
  }

  const block = new MemoryBlockstore()
  const threshold = 1343

  it('uses the same shard threshold as go-unixfsnode (under threshold)', async function () {
    const result = await last(importer(buildSource(threshold), block, {
      cidVersion: 1,
      rawLeaves: true
    }))

    if (result == null) {
      throw new Error('Nothing imported')
    }

    expect(result).to.have.property('size', 490665n)
    expect(result).to.have.nested.property('unixfs.type', 'directory')
    expect(result.cid.toString()).to.be.equal('bafybeihecq4rpl4nw3cgfb2uiwltgsmw5sutouvuldv5fxn4gfbihvnalq')
  })

  it('uses the same shard threshold as go-unixfsnode (over threshold)', async function () {
    const result = await last(importer(buildSource(threshold + 1), block, {
      cidVersion: 1,
      rawLeaves: true
    }))

    if (result == null) {
      throw new Error('Nothing imported')
    }

    expect(result).to.have.property('size', 515735n)
    expect(result).to.have.nested.property('unixfs.type', 'hamt-sharded-directory')
    expect(result.cid.toString()).to.be.equal('bafybeigyvxs6og5jbmpaa43qbhhd5swklqcfzqdrtjgfh53qjon6hpjaye')
  })
})
