/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 5] */
'use strict'

const { expect } = require('aegir/utils/chai')
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const loadFixture = require('aegir/fixtures')
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
      let ipld
      let block

      before(async () => {
        ipld = await inMemory(IPLD)
        block = blockApi(ipld)
      })

      it('imports and exports', async () => {
        const path = `${strategy}-big.dat`
        const values = [{ path: path, content: bigFile }]

        for await (const file of importer(values, block, importerOptions)) {
          expect(file.path).to.eql(path)

          const result = await exporter(file.cid, ipld)

          expect(result.unixfs.fileSize()).to.eql(bigFile.length)
        }
      })
    })
  })
})
