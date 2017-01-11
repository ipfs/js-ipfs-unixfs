'use strict'

const pull = require('pull-stream')
const generate = require('pull-generate')

const randomByteStream = require('./random-byte-stream')
const chunker = require('../../src/chunker/fixed-size')

const REPEATABLE_CHUNK_SIZE = 300000

module.exports = function (maxSize, seed) {
  const chunks = Math.ceil(maxSize / REPEATABLE_CHUNK_SIZE)
  return pull(
    generate(0, generator),
    pull.take(chunks)
  )

  function generator (iteration, cb) {
    if (iteration === 0) {
      pull(
        randomByteStream(seed),
        chunker(REPEATABLE_CHUNK_SIZE),
        pull.take(1),
        pull.collect((err, results) => {
          const result = results[0]
          cb(err, result, result)
        })
      )
    } else {
      cb(null, iteration, iteration)
    }
  }
}
