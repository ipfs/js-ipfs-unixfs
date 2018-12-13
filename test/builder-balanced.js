/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const collect = require('pull-stream/sinks/collect')
const builder = require('../src/builder/balanced')

function reduce (leaves, callback) {
  if (leaves.length > 1) {
    callback(null, { children: leaves })
  } else {
    callback(null, leaves[0])
  }
}

const options = {
  maxChildrenPerNode: 3
}

describe('builder: balanced', () => {
  it('reduces one value into itself', (callback) => {
    pull(
      values([1]),
      builder(reduce, options),
      collect((err, result) => {
        expect(err).to.not.exist()
        expect(result).to.be.eql([1])
        callback()
      })
    )
  })

  it('reduces 3 values into parent', (callback) => {
    pull(
      values([1, 2, 3]),
      builder(reduce, options),
      collect((err, result) => {
        expect(err).to.not.exist()
        expect(result).to.be.eql([{
          children: [1, 2, 3]
        }])
        callback()
      })
    )
  })

  it('obeys max children per node', (callback) => {
    pull(
      values([1, 2, 3, 4]),
      builder(reduce, options),
      collect((err, result) => {
        expect(err).to.not.exist()
        expect(result).to.be.eql([
          {
            children: [
              {
                children: [1, 2, 3]
              },
              4
            ]
          }
        ])
        callback()
      })
    )
  })

  it('refolds 2 parent nodes', (callback) => {
    pull(
      values([1, 2, 3, 4, 5, 6, 7]),
      builder(reduce, options),
      collect((err, result) => {
        expect(err).to.not.exist()
        expect(result).to.be.eql([
          {
            children: [
              {
                children: [1, 2, 3]
              },
              {
                children: [4, 5, 6]
              },
              7
            ]
          }
        ])
        callback()
      })
    )
  })
})
