import { expect } from 'aegir/chai'
import { CID } from 'multiformats/cid'
import { isValidLink } from '../../../src/walk-path/utils/unixfs-stream.ts'
import { foreignCID } from '../../helpers/foreign-cid.ts'

describe('unixfs-stream', () => {
  const cid = CID.parse('QmWHMpCtdNjemT2F3SjyrmnBXQXwEohaZd4apcbFBhbFRC')

  it('should accept a link with a CID', () => {
    expect(isValidLink({ name: 'foo', hash: cid })).to.be.true()
  })

  it('should accept a link with a CID from another copy of multiformats', () => {
    expect(isValidLink({ name: 'foo', hash: foreignCID(cid) })).to.be.true()
  })

  it('should reject a link without a CID', () => {
    expect(isValidLink({ name: 'foo', hash: 'bar' })).to.be.false()
  })
})
