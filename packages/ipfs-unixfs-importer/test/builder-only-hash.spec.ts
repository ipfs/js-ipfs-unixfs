/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { dagBuilder } from '../src/dag-builder/index.js'
import all from 'it-all'
import { MemoryBlockstore } from 'blockstore-core'
import defaultOptions from '../src/options.js'
import asAsyncIterable from './helpers/as-async-iterable.js'

describe('builder: onlyHash', () => {
  const block = new MemoryBlockstore()

  it('will only chunk and hash if passed an "onlyHash" option', async () => {
    const nodes = await all(dagBuilder([{
      path: 'foo.txt',
      content: asAsyncIterable(Uint8Array.from([0, 1, 2, 3, 4]))
    }], block, {
      ...defaultOptions({}),
      onlyHash: true
    }))

    expect(nodes.length).to.equal(1)

    try {
      await block.get((await nodes[0]()).cid)

      throw new Error('Should have errored')
    } catch (err: any) {
      expect(err.code).to.equal('ERR_NOT_FOUND')
    }
  })
})
