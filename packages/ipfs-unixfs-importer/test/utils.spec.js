/* eslint-env mocha */

import { expect } from 'aegir/chai'
import toPathComponents from '../src/utils/to-path-components.js'

describe('toPathComponents', () => {
  it('splits on unescaped "/" characters', () => {
    const path = 'foo/bar/baz'
    const components = toPathComponents(path)
    expect(components.length).to.eq(3)
  })

  it('does not split on escaped "/" characters', () => {
    const path = 'foo\\/bar/baz'
    const components = toPathComponents(path)
    expect(components.length).to.eq(2)
  })

  // see https://github.com/ipfs/js-ipfs-unixfs/issues/177 for context
  it('does not split on "^" characters', () => {
    const path = 'foo/bar^baz^^qux'
    const components = toPathComponents(path)
    expect(components.length).to.eq(2)
  })
})
