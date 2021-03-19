'use strict'

/**
 * @param {number} seed
 */
async function * randomByteStream (seed) {
  while (true) {
    const r = Math.floor(random(seed) * 256)
    seed = r

    yield Uint8Array.from([r])
  }
}

/**
 * @param {number} seed
 */
function random (seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

module.exports = randomByteStream
