var through2 = require('through2')

exports = module.exports = FixedSizeChunker

// The difference of this chunker compared to other fixed size chunkers
// available, is that it doesn't add padding the last chunk

function FixedSizeChunker (size) {
  var stream = through2(transform, flush)

  var buf = new Buffer(0)

  function transform (chunk, enc, cb) {
    var that = this

    buf = Buffer.concat([buf, chunk])

    if (buf.length >= size) {
      slice()
    }

    function slice () {
      var chunk = new Buffer(size, 'binary')
      var newBuf = new Buffer(buf.length - size, 'binary')
      buf.copy(chunk, 0, 0, size)
      buf.copy(newBuf, 0, size - 1, buf.length - size)
      buf = newBuf
      that.push(chunk)

      if (buf.length >= size) {
        return slice()
      }
    }

    cb()
  }

  function flush (cb) {
    // last chunk
    this.push(buf)
    cb()
  }

  return stream
}
