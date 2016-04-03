/* eslint-env mocha */

describe('IPFS-UnixFS Tests on the Browser', function () {
  this.timeout(10000)

  it('', () => {
    const testsContext = require.context('.', true, /test-*/)
    testsContext
      .keys()
      .filter((key) => {
        return !(key.endsWith('-node.js') || key.endsWith('-node'))
      })
      .forEach((key) => {
        testsContext(key)
      })
  })
})
