/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 5] */
'use strict'

const { expect } = require('aegir/utils/chai')
// @ts-ignore
const loadFixture = require('aegir/utils/fixtures')
// @ts-ignore
const isNode = require('detect-node')
const bigFile = loadFixture((isNode ? __dirname : 'test') + '/fixtures/1.2MiB.txt')
const blockApi = require('./helpers/block')
const asAsyncIterable = require('./helpers/as-async-iterable')

const { importer } = require('ipfs-unixfs-importer')
const { exporter } = require('../src')

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
      /** @type {import('ipfs-unixfs-importer/src/types').BlockAPI} */
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
