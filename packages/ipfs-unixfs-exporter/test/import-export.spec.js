/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 5] */
import { expect } from 'aegir/utils/chai.js'
import loadFixture from 'aegir/utils/fixtures.js'
import blockApi from './helpers/block.js'
import asAsyncIterable from './helpers/as-async-iterable.js'

import { importer } from 'ipfs-unixfs-importer'
import { exporter } from '../src/index.js'

/** @type {Uint8Array} */
const bigFile = loadFixture(('test') + '/fixtures/1.2MiB.txt')

const strategies = [
  'flat',
  'balanced',
  'trickle'
]

describe('import and export', function () {
  this.timeout(30 * 1000)

  strategies.forEach((strategy) => {
    const importerOptions = { strategy: strategy }

    describe('using builder: ' + strategy, () => {
      const block = blockApi()

      it('imports and exports', async () => {
        const path = `${strategy}-big.dat`
        const values = [{ path: path, content: asAsyncIterable(bigFile) }]

        // @ts-ignore
        for await (const file of importer(values, block, importerOptions)) {
          expect(file.path).to.eql(path)

          const result = await exporter(file.cid, block)

          if (result.type !== 'file') {
            throw new Error('Unexpected type')
          }

          expect(result.unixfs.fileSize()).to.eql(bigFile.length)
        }
      })
    })
  })
})
