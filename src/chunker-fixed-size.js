// Heavily inspired by https://github.com/chrisdickinson/chunk-stream
// need to update to through2

var through = require('through')
var Buffer = require('buffer').Buffer
var min = Math.min

exports = module.exports = FixedSizeChunker

function FixedSizeChunker (size, Type) {
  Type = Type || Buffer

  var stream = through(write, end)
  var buffered_bytes = 0
  var buffer = []
  var chunk = new Type(size)
  var offset = 0

  return stream

  function write (input) {
    buffer[buffer.length] = input
    buffered_bytes += input.length

    if (buffered_bytes < size) {
      return
    }

    output()
  }

  function end () {
    if (buffer.length) {
      output()
    }
    stream.queue(null)
  }

  function output () {
    var idx = 0
    var end

    while (buffered_bytes >= size && idx < buffer.length) {
      if (!buffer[idx].length) {
        ++idx
        continue
      }

      end = min(size, buffer[idx].length)

      buffer[idx].copy(chunk, offset, 0, end)
      buffered_bytes -= end - offset
      offset = end

      buffer[idx] = buffer[idx].slice(end)

      if (offset === size) {
        stream.queue(chunk)
        offset = 0
        chunk = new Type(size)
      }
    }

    buffer = buffer.slice(idx)
  }
}
