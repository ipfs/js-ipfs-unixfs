/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 5] */

import { expect } from 'aegir/chai'
import loadFixture from 'aegir/fixtures'
import { MemoryBlockstore } from 'blockstore-core'
import { importer } from 'ipfs-unixfs-importer'
import { flat, balanced, trickle } from 'ipfs-unixfs-importer/layout'
import { exporter } from '../src/index.js'
import asAsyncIterable from './helpers/as-async-iterable.js'
import type { ImporterOptions } from 'ipfs-unixfs-importer'
import type { FileLayout } from 'ipfs-unixfs-importer/layout'

const bigFile = loadFixture(('test') + '/fixtures/1.2MiB.txt')

const layouts: Record<string, FileLayout > = {
  flat: flat(),
  balanced: balanced(),
  trickle: trickle()
}

describe('import and export', function () {
  this.timeout(30 * 1000)

  Object.entries(layouts).forEach(([name, layout]) => {
    const importerOptions: ImporterOptions = { layout }

    describe('using builder: ' + name, () => {
      const block = new MemoryBlockstore()

      it('imports and exports', async () => {
        const path = `${name}-big.dat`
        const values = [{ path, content: asAsyncIterable(bigFile) }]

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
