/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const collect = require('pull-stream/sinks/collect')

const builder = require('../src/builder/flat')

function reduce (leaves, callback) {
  if (leaves.length > 1) {
    callback(null, { children: leaves })
  } else {
    callback(null, leaves[0])
  }
}

describe('builder: flat', () => {
  it('reduces one value into itself', (callback) => {
    pull(
      values([1]),
      builder(reduce),
      collect((err, result) => {
        expect(err).to.not.exist()
        expect(result).to.be.eql([1])
        callback()
      })
    )
  })

  it('reduces 2 values into parent', (callback) => {
    pull(
      values([1, 2]),
      builder(reduce),
      collect((err, result) => {
        expect(err).to.not.exist()
        expect(result).to.eql([{ children: [1, 2] }])
        callback()
      })
    )
  })
})
