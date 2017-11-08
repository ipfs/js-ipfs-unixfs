/* eslint-env mocha */
'use strict'

const expect = require('chai').expect

const ConsumableBuffer = require('../src/hamt/consumable-buffer')

describe('HAMT: consumable buffer', () => {
  let buf

  it('can create an empty one', () => {
    buf = new ConsumableBuffer([])
  })

  it('from which I can take nothing', () => {
    expect(buf.take(0)).to.be.eql(0)
  })

  it('from which I can keep on taking', () => {
    expect(buf.take(100)).to.be.eql(0)
    expect(buf.take(1000)).to.be.eql(0)
  })

  it('can create one with one zeroed byte', () => {
    buf = new ConsumableBuffer([0])
  })

  it('from which I can take nothing', () => {
    expect(buf.take(0)).to.be.eql(0)
  })

  it('from which I can keep on taking', () => {
    expect(buf.take(100)).to.be.eql(0)
    expect(buf.take(1000)).to.be.eql(0)
  })

  it('can create one with one byte with ones', () => {
    buf = new ConsumableBuffer([0b11111111])
  })

  it('from which I can take nothing', () => {
    expect(buf.take(0)).to.be.eql(0)
  })

  it('from which I can take one bit at a time', () => {
    for (let i = 0; i < 8; i++) {
      expect(buf.take(1)).to.be.eql(1)
    }
  })

  it('should be exhausted', () => {
    expect(buf.take(1)).to.be.eql(0)
  })

  it('from which I can keep on taking', () => {
    expect(buf.take(100)).to.be.eql(0)
    expect(buf.take(1000)).to.be.eql(0)
  })

  it('can create one with 3 full bytes', () => {
    buf = new ConsumableBuffer([0xff, 0xff, 0xff])
  })

  it('from which I can take nothing', () => {
    expect(buf.take(0)).to.be.eql(0)
  })

  it('from which I can take one bit at a time', () => {
    for (let i = 0; i < 24; i++) {
      expect(buf.take(1)).to.be.eql(1)
    }
  })

  it('should be exhausted', () => {
    expect(buf.take(1)).to.be.eql(0)
  })

  it('can create one with 3 full bytes', () => {
    buf = new ConsumableBuffer([0xff, 0xff, 0xff])
  })

  it('from which I can take 2 bits at a time', () => {
    for (let i = 0; i < 12; i++) {
      expect(buf.take(2)).to.be.eql(3)
    }
  })

  it('should be exhausted', () => {
    expect(buf.take(1)).to.be.eql(0)
  })

  it('can create one with 3 full bytes', () => {
    buf = new ConsumableBuffer([0xff, 0xff, 0xff])
  })

  it('from which I can take every bit', () => {
    expect(buf.take(24)).to.be.eql(0b111111111111111111111111)
  })

  it('should be exhausted', () => {
    expect(buf.take(1)).to.be.eql(0)
  })
})
