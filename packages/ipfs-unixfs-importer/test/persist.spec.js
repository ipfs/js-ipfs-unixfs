const { expect } = require('aegir/utils/chai')
// @ts-ignore
const IPLD = require('ipld')
// @ts-ignore
const inMemory = require('ipld-in-memory')
const blockApi = require('./helpers/block')
const persist = require('../src/utils/persist')

describe('persist', () => {
  /** @type {import('ipld')} */
  let ipld
  /** @type {import('../src').BlockAPI} */
  let block

  before(async () => {
    ipld = await inMemory(IPLD)
    block = blockApi(ipld)
  })

  it('persists files with specified multibaseName', async () => {
      const cid = await persist(new Uint8Array(2), block, { cidVersion: 1, multibaseName: 'base2' })
      expect(cid.multibaseName).to.equal('base2')
  })

})
