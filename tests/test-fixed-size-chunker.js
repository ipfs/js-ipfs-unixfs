/* globals describe, it */

var FixedSizeChunker = require('./../src/chunker-fixed-size')
var fs = require('fs')
var stream = require('stream')
var expect = require('chai').expect

describe('chunker: fixed size', function () {
  it('256 Bytes chunks', function (done) {
    var writable = new stream.Writable({
      write: function (chunk, encoding, next) {
        expect(chunk.length).to.equal(256)
        next()
      }
    })

    fs.createReadStream(__dirname + '/test-data/1MiB.txt')
      .pipe(FixedSizeChunker(256))
      .pipe(writable)

    writable.on('finish', done)
  })

  it('256 KiB chunks', function (done) {
    var KiB256 = 262144
    var writable = new stream.Writable({
      write: function (chunk, encoding, next) {
        expect(chunk.length).to.equal(KiB256)
        next()
      }
    })

    fs.createReadStream(__dirname + '/test-data/1MiB.txt')
      .pipe(FixedSizeChunker(KiB256))
      .pipe(writable)

    writable.on('finish', done)
  })

  it('256 KiB chunks of non scalar filesize', function (done) {
    var counter = 0
    var KiB256 = 262144
    var writable = new stream.Writable({
      write: function (chunk, encoding, next) {
        if (chunk.length < KiB256) {
          expect(counter).to.be.below(2)
          counter += 1
          return next()
        }
        expect(chunk.length).to.equal(KiB256)
        next()
      }
    })

    fs.createReadStream(__dirname + '/test-data/1.2MiB.txt')
      .pipe(FixedSizeChunker(KiB256))
      .pipe(writable)

    writable.on('finish', done)
  })
})
