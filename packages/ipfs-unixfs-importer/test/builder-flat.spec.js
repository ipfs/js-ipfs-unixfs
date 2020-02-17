/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const builder = require('../src/dag-builder/file/flat')
const all = require('it-all')

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
    const result = await all(builder(source, reduce))

    expect(result).to.be.eql([1])
  })

  it('reduces 2 values into parent', async () => {
    const source = [1, 2]
    const result = await all(builder(source, reduce))

    expect(result).to.be.eql([{ children: [1, 2] }])
  })
})
