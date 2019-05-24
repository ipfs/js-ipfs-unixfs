'use strict'

const errCode = require('err-code')
const Long = require('long')
const BufferList = require('bl')
let rabin

module.exports = async function * rabinChunker (source, options) {
  if (!rabin) {
    try {
      rabin = nativeRabin()
    } catch (_) {
      // fallback to js implementation
      rabin = jsRabin()
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

const nativeRabin = () => {
  const createRabin = require('rabin')

  if (typeof rabin !== 'function') {
    throw errCode(new Error(`rabin was not a function`), 'ERR_UNSUPPORTED')
  }

  return async function * (source, options) {
    const rabin = createRabin(options)

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

    if (rabin.buffers.length) {
      yield rabin.buffers.slice(0)
    }
  }
}

const jsRabin = () => {
  // see https://github.com/datproject/rabin/blob/c0378395dc0a125ab21ac176ec504f9995b34e62/src/rabin.cc
  class Rabin {
    constructor (options) {
      this.window = new Array(options.window || 64).fill(Long.fromInt(0))
      this.wpos = 0
      this.count = 0
      this.digest = Long.fromInt(0)
      this.chunkLength = 0
      this.polynomial = options.polynomial
      this.polynomialDegree = 53
      this.polynomialShift = this.polynomialDegree - 8
      this.averageBits = options.bits || 12
      this.minSize = options.min || 8 * 1024
      this.maxSize = options.max || 32 * 1024
      this.mask = Long.fromInt(1).shiftLeft(this.averageBits).subtract(1)
      this.modTable = []
      this.outTable = []

      this.calculateTables()
    }

    calculateTables () {
      for (let i = 0; i < 256; i++) {
        let hash = Long.fromInt(0, true)

        hash = this.appendByte(hash, i)

        for (let j = 0; j < this.window.length - 1; j++) {
          hash = this.appendByte(hash, 0)
        }

        this.outTable[i] = hash
      }

      const k = this.deg(this.polynomial)

      for (let i = 0; i < 256; i++) {
        const b = Long.fromInt(i, true)

        this.modTable[i] = b.shiftLeft(k)
          .modulo(this.polynomial)
          .or(b.shiftLeft(k))
      }
    }

    deg (p) {
      let mask = Long.fromString('0x8000000000000000', true, 16)

      for (let i = 0; i < 64; i++) {
        if (mask.and(p).greaterThan(0)) {
          return Long.fromInt(63 - i)
        }

        mask = mask.shiftRight(1)
      }

      return Long.fromInt(-1)
    }

    appendByte (hash, b) {
      hash = hash.shiftLeft(8)
      hash = hash.or(b)

      return hash.modulo(this.polynomial)
    }

    getFingerprints (bufs) {
      const lengths = []

      for (let i = 0; i < bufs.length; i++) {
        let buf = bufs[i]

        while (true) {
          const remaining = this.nextChunk(buf)

          if (remaining < 0) {
            break
          }

          buf = buf.slice(remaining)

          lengths.push(this.chunkLength)
        }
      }

      return lengths
    }

    nextChunk (buf) {
      for (let i = 0; i < buf.length; i++) {
        const val = Long.fromInt(buf[i])

        this.slide(val)

        this.count++

        if ((this.count >= this.minSize && this.digest.and(this.mask).equals(0)) || this.count >= this.maxSize) {
          this.chunkLength = this.count

          this.reset()

          return i + 1
        }
      }

      return -1
    }

    slide (value) {
      const out = this.window[this.wpos].toInt() & 255
      this.window[this.wpos] = value
      this.digest = this.digest.xor(this.outTable[out])
      this.wpos = (this.wpos + 1) % this.window.length

      this.append(value)
    }

    reset () {
      this.window = this.window.map(() => Long.fromInt(0))
      this.wpos = 0
      this.count = 0
      this.digest = Long.fromInt(0)

      this.slide(Long.fromInt(1))
    }

    append (value) {
      const index = this.digest.shiftRight(this.polynomialShift).toInt() & 255
      this.digest = this.digest.shiftLeft(8)
      this.digest = this.digest.or(value)

      const entry = this.modTable[index]

      if (entry) {
        this.digest = this.digest.xor(entry)
      }
    }
  }

  return async function * (source, options) {
    const r = new Rabin(options)
    const buffers = new BufferList()
    let pending = []

    for await (const chunk of source) {
      buffers.append(chunk)
      pending.push(chunk)

      const sizes = r.getFingerprints(pending)
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
