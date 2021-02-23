/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')
const builder = require('../src/dag-builder/file/flat')

/**
 * @param {*} leaves
 */
function reduce (leaves) {
  if (leaves.length > 1) {
    return { children: leaves }
  } else {
    return leaves[0]
  }
}

describe('builder: flat', () => {
  it('reduces one value into itself', async () => {
    const source = [1]
    // @ts-ignore
    const result = await builder(source, reduce)

    expect(result).to.be.eql(1)
  })

  it('reduces 2 values into parent', async () => {
    const source = [1, 2]
    // @ts-ignore
    const result = await builder(source, reduce)

    expect(result).to.be.eql({ children: [1, 2] })
  })
})
