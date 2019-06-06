'use strict'

const BufferList = require('bl')
const { create } = require('rabin-wasm')
const errcode = require('err-code')

module.exports = async function * rabinChunker (source, options) {
  const rabin = jsRabin()

  let min, max, avg

  if (options.minChunkSize && options.maxChunkSize && options.avgChunkSize) {
    avg = options.avgChunkSize
    min = options.minChunkSize
    max = options.maxChunkSize
  } else if (!options.avgChunkSize) {
    throw errcode(new Error('please specify an average chunk size'), 'ERR_INVALID_AVG_CHUNK_SIZE')
  } else {
    avg = options.avgChunkSize
    min = avg / 3
    max = avg + (avg / 2)
  }

  // validate min/max/avg in the same way as go
  if (min < 16) {
    throw errcode(new Error('rabin min must be greater than 16'), 'ERR_INVALID_MIN_CHUNK_SIZE')
  }

  if (max < min) {
    max = min
  }

  if (avg < min) {
    avg = min
  }

  const sizepow = Math.floor(Math.log2(avg))

  for await (const chunk of rabin(source, {
    min: min,
    max: max,
    bits: sizepow,
    window: options.window,
    polynomial: options.polynomial
  })) {
    yield chunk
  }
}

const jsRabin = () => {
  return async function * (source, options) {
    const r = await create(options.bits, options.min, options.max, options.window)
    const buffers = new BufferList()
    let pending = []

    for await (const chunk of source) {
      buffers.append(chunk)
      pending.push(chunk)

      const sizes = r.fingerprint(Buffer.concat(pending))
      pending = []

      for (let i = 0; i < sizes.length; i++) {
        var size = sizes[i]
        var buf = buffers.slice(0, size)
        buffers.consume(size)

        yield buf
      }
    }

    if (buffers.length) {
      yield buffers.slice(0)
    }
  }
}
