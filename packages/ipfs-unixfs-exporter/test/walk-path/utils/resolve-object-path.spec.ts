import { expect } from 'aegir/chai'
import { CID } from 'multiformats/cid'
import { resolveObjectPath } from '../../../src/walk-path/utils/resolve-object-path.ts'

describe('resolve-object-path', () => {
  it('should resolve property path', () => {
    const result = resolveObjectPath({
      foo: 'bar'
    }, [
      'foo'
    ])

    expect(result).to.have.property('value', 'bar')
    expect(result).to.have.deep.property('rest', [])
  })

  it('should resolve deep property path', () => {
    const result = resolveObjectPath({
      foo: {
        bar: 'baz'
      }
    }, [
      'foo',
      'bar'
    ])

    expect(result).to.have.property('value', 'baz')
    expect(result).to.have.deep.property('rest', [])
  })

  it('should resolve property path with rest when property value is CID', () => {
    const cid = CID.parse('QmWHMpCtdNjemT2F3SjyrmnBXQXwEohaZd4apcbFBhbFRC')

    const result = resolveObjectPath({
      foo: cid
    }, [
      'foo',
      'baz'
    ])

    expect(result).to.have.property('value', cid)
    expect(result).to.have.deep.property('rest', ['baz'])
  })

  it('should throw when object does not have property', () => {
    expect(() => resolveObjectPath({
      foo: 'bar'
    }, [
      'bar'
    ])
    ).to.throw()
      .with.property('name', 'BadPathError')
  })

  it('should throw when object does not have deep property', () => {
    expect(() => resolveObjectPath({
      foo: {
        bar: 'baz'
      }
    }, [
      'bar',
      'qux'
    ])
    ).to.throw()
      .with.property('name', 'BadPathError')
  })
})
