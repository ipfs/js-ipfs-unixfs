/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const crypto = require('crypto')
const each = require('async/each')
const eachSeries = require('async/eachSeries')

const HAMT = require('../src/hamt')

const hashFn = function (value, callback) {
  callback(null, crypto
    .createHash('sha256')
    .update(value)
    .digest())
}

const options = {
  hashFn: hashFn
}

describe('HAMT', () => {
  describe('basic', () => {
    let bucket
    it('can create an empty one', () => {
      bucket = HAMT(options)
    })

    it('get unknown key returns undefined', (callback) => {
      bucket.get('unknown', (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.be.undefined()
        callback()
      })
    })

    it('can put a value', (callback) => {
      bucket.put('key', 'value', callback)
    })

    it('can get that value', (callback) => {
      bucket.get('key', (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.eql('value')
        callback()
      })
    })

    it('can override a value', (callback) => {
      bucket.put('key', 'a different value', callback)
    })

    it('can get that value', (callback) => {
      bucket.get('key', (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.eql('a different value')
        callback()
      })
    })

    it('can remove a non existing value', (callback) => {
      bucket.del('a key which does not exist', callback)
    })

    it('can remove an existing value', (callback) => {
      bucket.del('key', callback)
    })

    it('get deleted key returns undefined', (callback) => {
      bucket.get('key', (err, result) => {
        expect(err).to.not.exist()
        expect(result).to.be.undefined()
        callback()
      })
    })
  })

  describe('many keys', () => {
    let bucket
    let keys
    let masterHead

    it('can create an empty one', () => {
      bucket = HAMT(options)
    })

    it('accepts putting many keys', (done) => {
      const max = 400
      keys = new Array(max)
      for (let i = 1; i <= max; i++) {
        keys[i - 1] = i.toString()
      }

      each(keys, (key, callback) => bucket.put(key, key, callback), done)
    })

    it('can remove all the keys and still find remaining', function (done) {
      this.timeout(10 * 1000)

      masterHead = keys.pop()
      iterate()

      function iterate () {
        const head = keys.shift()
        if (!head) {
          done()
          return // early
        }

        bucket.get(head, (err, value) => {
          expect(err).to.not.exist()
          expect(value).to.eql(head)
          bucket.del(head, afterDel)
        })

        function afterDel (err) {
          expect(err).to.not.exist()
          bucket.get(head, afterGet)
        }

        function afterGet (err, value) {
          expect(err).to.not.exist()
          expect(value).to.be.undefined()

          each(keys, onEachKey, reiterate)
        }
      }

      function onEachKey (key, callback) {
        bucket.get(key, (err, value) => {
          expect(err).to.not.exist()
          expect(value).to.eql(key)
          callback()
        })
      }

      function reiterate (err) {
        expect(err).to.not.exist()
        // break from stack on next iteration
        process.nextTick(iterate)
      }
    })

    it('collapsed all the buckets', () => {
      expect(bucket.toJSON()).to.be.eql([masterHead])
    })

    it('can still find sole head', (callback) => {
      bucket.get(masterHead, (err, value) => {
        expect(err).to.not.exist()
        expect(value).to.be.eql(masterHead)
        callback()
      })
    })
  })

  describe('exhausting hash', () => {
    let bucket

    before(() => {
      bucket = HAMT({
        hashFn: smallHashFn,
        bits: 2
      })
    })

    it('iterates', (callback) => {
      const size = 300
      const keys = Array(size)
      for (let i = 0; i < size; i++) {
        keys[i] = i.toString()
      }

      eachSeries(keys, (key, callback) => bucket.put(key, key, callback), (err) => {
        expect(err).to.not.exist()
        callback()
      })
    })

    function smallHashFn (value, callback) {
      callback(null, crypto
        .createHash('sha256')
        .update(value)
        .digest()
        .slice(0, 2)) // just return the 2 first bytes of the hash
    }
  })
})
