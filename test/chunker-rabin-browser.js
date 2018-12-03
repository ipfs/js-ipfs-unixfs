/* eslint-env mocha */
'use strict'

const chunker = require('./../src/chunker/rabin')
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const collect = require('pull-stream/sinks/collect')

describe('chunker: rabin browser', function () {
  it('returns an error', (done) => {
    const b1 = Buffer.alloc(2 * 256)
    const b2 = Buffer.alloc(1 * 256)
    const b3 = Buffer.alloc(5 * 256)

    b1.fill('a')
    b2.fill('b')
    b3.fill('c')

    pull(
      values([b1, b2, b3]),
      chunker({ minChunkSize: 48, avgChunkSize: 96, maxChunkSize: 192 }),
      collect((err) => {
        expect(err).to.exist()
        expect(err.message).to.include('Rabin chunker not available')

        done()
      })
    )
  })
})
