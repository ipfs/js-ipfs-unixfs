/* eslint-env mocha */

describe('IPFS-UnixFS Tests on the Browser', function () {
  this.timeout(10000)

  it('', () => {
    const testsContext = require.context('.', true, /.*?spec.js$/)
    console.log('KEYS', testsContext.keys())
    testsContext
      .keys()
      .filter((key) => {
        return !key.endsWith('-node.spec.js')
      })
      .forEach((key) => {
        testsContext(key)
      })
  })
})
