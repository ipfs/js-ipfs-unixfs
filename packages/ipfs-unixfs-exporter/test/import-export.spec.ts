/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 5] */

import { expect } from 'aegir/chai'
import loadFixture from 'aegir/fixtures'
import { MemoryBlockstore } from 'blockstore-core'
import asAsyncIterable from './helpers/as-async-iterable.js'
import { importer } from 'ipfs-unixfs-importer'
import { exporter } from '../src/index.js'

const bigFile = loadFixture(('test') + '/fixtures/1.2MiB.txt')

const strategies = [
  'flat',
  'balanced',
  'trickle'
]

describe('import and export', function () {
  this.timeout(30 * 1000)

  strategies.forEach((strategy) => {
    const importerOptions = { strategy }

    describe('using builder: ' + strategy, () => {
      const block = new MemoryBlockstore()

      it('imports and exports', async () => {
        const path = `${strategy}-big.dat`
        const values = [{ path, content: asAsyncIterable(bigFile) }]

        // @ts-expect-error
        for await (const file of importer(values, block, importerOptions)) {
          expect(file.path).to.equal(path)

          const result = await exporter(file.cid, block)

          if (result.type !== 'file') {
            throw new Error('Unexpected type')
          }

          expect(result.unixfs.fileSize()).to.equal(BigInt(bigFile.length))
        }
      })
    })
  })
})
