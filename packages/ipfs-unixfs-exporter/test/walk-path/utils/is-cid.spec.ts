import { expect } from 'aegir/chai'
import { CID } from 'multiformats/cid'
import { isCID } from '../../../src/walk-path/utils/is-cid.ts'
import { foreignCID } from '../../helpers/foreign-cid.ts'

describe('is-cid', () => {
  const cid = CID.parse('QmWHMpCtdNjemT2F3SjyrmnBXQXwEohaZd4apcbFBhbFRC')

  it('should accept a CID', () => {
    expect(isCID(cid)).to.be.true()
  })

  it('should accept a CID from another copy of multiformats', () => {
    expect(isCID(foreignCID(cid))).to.be.true()
  })

  it('should reject a non-CID', () => {
    expect(isCID({ foo: 'bar' })).to.be.false()
    expect(isCID(undefined)).to.be.false()
  })
})
