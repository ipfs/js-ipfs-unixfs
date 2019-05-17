/* eslint-env mocha */
'use strict'

const chunker = require('../src/chunker/rabin')
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const isNode = require('detect-node')
const all = require('async-iterator-all')

describe('chunker: rabin browser', () => {
  before(function () {
    if (isNode) {
      this.skip()
    }
  })

  it('returns an error', async () => {
    try {
      await all(chunker())
    } catch (err) {
      expect(err.code).to.equal('ERR_UNSUPPORTED')
    }
  })
})
