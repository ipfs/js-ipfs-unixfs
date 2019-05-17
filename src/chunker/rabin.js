'use strict'

const errCode = require('err-code')

let createRabin

module.exports = async function * rabinChunker (source, options) {
  if (!createRabin) {
    try {
      createRabin = require('rabin')

      if (typeof createRabin !== 'function') {
        throw errCode(new Error(`createRabin was not a function`), 'ERR_UNSUPPORTED')
      }
    } catch (err) {
      throw errCode(new Error(`Rabin chunker not available, it may have failed to install or not be supported on this platform`), 'ERR_UNSUPPORTED')
    }
  }

  let min, max, avg

  if (options.minChunkSize && options.maxChunkSize && options.avgChunkSize) {
    avg = options.avgChunkSize
    min = options.minChunkSize
    max = options.maxChunkSize
  } else {
    avg = options.avgChunkSize
    min = avg / 3
    max = avg + (avg / 2)
  }

  const sizepow = Math.floor(Math.log2(avg))
  const rabin = createRabin({
    min: min,
    max: max,
    bits: sizepow,
    window: options.window,
    polynomial: options.polynomial
  })

  // TODO: rewrite rabin using node streams v3
  for await (const chunk of source) {
    rabin.buffers.append(chunk)
    rabin.pending.push(chunk)

    const sizes = []

    rabin.rabin.fingerprint(rabin.pending, sizes)
    rabin.pending = []

    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i]
      const buf = rabin.buffers.slice(0, size)
      rabin.buffers.consume(size)

      yield buf
    }
  }
}
