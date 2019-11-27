/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const builder = require('../src/dag-builder/file/balanced')
const all = require('it-all')

function reduce (leaves) {
  if (leaves.length > 1) {
    return { children: leaves }
  } else {
    return leaves[0]
  }
}

const options = {
  maxChildrenPerNode: 3
}

describe('builder: balanced', () => {
  it('reduces one value into itself', async () => {
    const source = [1]

    const result = await all(builder(source, reduce, options))

    expect(result).to.deep.equal(source)
  })

  it('reduces 3 values into parent', async () => {
    const source = [1, 2, 3]

    const result = await all(builder(source, reduce, options))

    expect(result).to.deep.equal([{
      children: [1, 2, 3]
    }])
  })

  it('obeys max children per node', async () => {
    const source = [1, 2, 3, 4]

    const result = await all(builder(source, reduce, options))

    expect(result).to.deep.equal([{
      children: [{
        children: [1, 2, 3]
      },
      4
      ]
    }])
  })

  it('refolds 2 parent nodes', async () => {
    const source = [1, 2, 3, 4, 5, 6, 7]

    const result = await all(builder(source, reduce, options))

    expect(result).to.deep.equal([{
      children: [{
        children: [1, 2, 3]
      }, {
        children: [4, 5, 6]
      },
      7
      ]
    }])
  })
})
