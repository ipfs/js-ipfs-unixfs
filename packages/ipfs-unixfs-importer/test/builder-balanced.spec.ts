import { expect } from 'aegir/chai'
import { CID } from 'multiformats/cid'
import { balanced } from '../src/layout/balanced.js'
import type { InProgressImportResult } from '../src/index.js'

async function reduce (leaves: InProgressImportResult[]): Promise<InProgressImportResult> {
  if (leaves.length > 1) {
    return {
      // @ts-expect-error children is not part of InProgressImportResult
      children: leaves
    }
  } else {
    return leaves[0]
  }
}

const options = {
  maxChildrenPerNode: 3
}

describe('builder: balanced', () => {
  it('reduces one value into itself', async () => {
    const source = [{
      cid: CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'),
      size: 0n,
      block: Uint8Array.from([])
    }]

    const result = await balanced(options)((async function * () {
      yield * source
    }()), reduce)

    expect(result).to.deep.equal(source[0])
  })

  it('reduces 3 values into parent', async () => {
    const source = [{
      cid: CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'),
      size: 0n,
      block: Uint8Array.from([])
    }, {
      cid: CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'),
      size: 0n,
      block: Uint8Array.from([])
    }, {
      cid: CID.parse('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'),
      size: 0n,
      block: Uint8Array.from([])
    }]

    const result = await balanced(options)((async function * () {
      yield * source
    }()), reduce)

    expect(result).to.deep.equal({
      children: source
    })
  })

  it('obeys max children per node', async () => {
    const source = [1, 2, 3, 4]

    // @ts-expect-error number is incorrect type
    const result = await balanced(options)((async function * () {
      yield * source
    }()), reduce)

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

    // @ts-expect-error number is incorrect type
    const result = await balanced(options)((async function * () {
      yield * source
    }()), reduce)

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
