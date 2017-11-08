/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const crypto = require('crypto')
const whilst = require('async/whilst')

const ConsumableHash = require('../src/hamt/consumable-hash')

describe('HAMT: consumable hash', () => {
  let hash, h
  const maxIter = 100
  const values = []

  it('can create a hashing function', () => {
    hash = ConsumableHash(hashFn)
  })

  it('can take a 0 length value', (callback) => {
    hash('some value').take(0, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.be.eql(0)
      callback()
    })
  })

  it('can take a 10 bit value', (callback) => {
    hash('some value').take(10, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.be.eql(110)
      callback()
    })
  })

  it('can keep on taking a 10 bit value', (callback) => {
    h = hash('some value')
    let iter = maxIter
    whilst(
      () => iter > 0,
      (callback) => {
        h.take(10, (err, result) => {
          expect(err).to.not.exist()
          values.push(result)
          expect(result).to.be.below(1024)
          expect(result).to.be.above(0)
          iter--
          callback()
        })
      },
      callback
    )
  })

  it('can untake all', () => {
    h.untake(10 * maxIter)
  })

  it('keeps taking the same values after untaking all', (callback) => {
    let iter = maxIter
    whilst(
      () => iter > 0,
      (callback) => {
        h.take(10, (err, result) => {
          expect(err).to.not.exist()
          values.push(result)
          expect(result).to.be.eql(values.shift())
          iter--
          callback()
        })
      },
      callback
    )
  })
})

function hashFn (value, callback) {
  callback(null, crypto
    .createHash('sha256')
    .update(value)
    .digest())
}
