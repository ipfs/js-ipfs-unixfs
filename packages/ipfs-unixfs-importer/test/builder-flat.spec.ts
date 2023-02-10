/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { flat } from '../src/dag-builder/file/flat.js'

function reduce (leaves: any[]): any {
  if (leaves.length > 1) {
    return { children: leaves }
  } else {
    return leaves[0]
  }
}

describe('builder: flat', () => {
  it('reduces one value into itself', async () => {
    const source = [1]
    // @ts-expect-error
    const result = await flat(source, reduce)

    expect(result).to.be.eql(1)
  })

  it('reduces 2 values into parent', async () => {
    const source = [1, 2]
    // @ts-expect-error
    const result = await flat(source, reduce)

    expect(result).to.be.eql({ children: [1, 2] })
  })
})
