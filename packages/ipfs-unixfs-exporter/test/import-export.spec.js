/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 5] */
'use strict'

const { expect } = require('aegir/utils/chai')
// @ts-ignore
const IPLD = require('ipld')
// @ts-ignore
const inMemory = require('ipld-in-memory')
// @ts-ignore
const loadFixture = require('aegir/fixtures')
// @ts-ignore
const isNode = require('detect-node')
const bigFile = loadFixture((isNode ? __dirname : 'test') + '/fixtures/1.2MiB.txt')
const blockApi = require('./helpers/block')

const importer = require('ipfs-unixfs-importer')
const exporter = require('../src')

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
      /** @type {import('ipfs-core-types/src/ipld').IPLD} */
      let ipld
      /** @type {import('ipfs-unixfs-importer').BlockAPI} */
      let block

      before(async () => {
        ipld = await inMemory(IPLD)
        block = blockApi(ipld)
      })

      it('imports and exports', async () => {
        const path = `${strategy}-big.dat`
        const values = [{ path: path, content: bigFile }]

        // @ts-ignore
        for await (const file of importer(values, block, importerOptions)) {
          expect(file.path).to.eql(path)

          const result = await exporter(file.cid, ipld)

          if (result.type !== 'file') {
            throw new Error('Unexpected type')
          }

          expect(result.unixfs.fileSize()).to.eql(bigFile.length)
        }
      })
    })
  })
})
