/* globals describe, it */

var FixedSizeChunker = require('./../src/chunker-fixed-size')
var fs = require('fs')
var stream = require('stream')
var expect = require('chai').expect

describe('chunker: fixed size', function () {
  it('256 Bytes', function (done) {
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

  it.skip('256 KiB', function (done) {
    done()
  })
})
