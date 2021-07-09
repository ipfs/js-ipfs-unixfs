/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')
const builder = require('../src/dag-builder/file/balanced')
const { CID } = require('multiformats/cid')
const defaultOptions = require('../src/options')

/**
 * @typedef {import('../src/types').InProgressImportResult} InProgressImportResult
 *
 * @param {InProgressImportResult[]} leaves
 * @returns {Promise<InProgressImportResult>}
 */
async function reduce (leaves) {
  if (leaves.length > 1) {
    return {
      // @ts-ignore
      children: leaves
    }
  } else {
    return leaves[0]
  }
}

const options = {
  ...defaultOptions(),
  maxChildrenPerNode: 3
}

describe('builder: balanced', () => {
  it('reduces one value into itself', async () => {
    const source = [{
      cid: CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'),
      size: 0
    }]

    const result = await builder((async function * () {
      yield * source
    }()), reduce, options)

    expect(result).to.deep.equal(source[0])
  })

  it('reduces 3 values into parent', async () => {
    const source = [{
      cid: CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'),
      size: 0
    }, {
      cid: CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'),
      size: 0
    }, {
      cid: CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'),
      size: 0
    }]

    const result = await builder((async function * () {
      yield * source
    }()), reduce, options)

    expect(result).to.deep.equal({
      children: source
    })
  })

  it('obeys max children per node', async () => {
    const source = [1, 2, 3, 4]

    // @ts-ignore
    const result = await builder((async function * () {
      yield * source
    }()), reduce, options)

    expect(result).to.deep.equal({
      children: [{
        children: [1, 2, 3]
      },
      4
      ]
    })
  })

  it('refolds 2 parent nodes', async () => {
    const source = [1, 2, 3, 4, 5, 6, 7]

    // @ts-ignore
    const result = await builder((async function * () {
      yield * source
    }()), reduce, options)

    expect(result).to.deep.equal({
      children: [{
        children: [1, 2, 3]
      }, {
        children: [4, 5, 6]
      },
      7
      ]
    })
  })
})
