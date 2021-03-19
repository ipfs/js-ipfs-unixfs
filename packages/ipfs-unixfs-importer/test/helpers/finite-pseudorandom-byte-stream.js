'use strict'

const REPEATABLE_CHUNK_SIZE = 300000

/**
 * @param {number} maxSize
 * @param {number} seed
 */
module.exports = async function * (maxSize, seed) {
  const chunks = Math.ceil(maxSize / REPEATABLE_CHUNK_SIZE)
  let emitted = 0
  const buf = new Uint8Array(REPEATABLE_CHUNK_SIZE)

  while (emitted !== chunks) {
    for (let i = 0; i < buf.length; i++) {
      buf[i] = 256 & Math.floor(random(seed) * 256)
    }

    yield buf

    emitted++
  }
}

/**
 * @param {number} seed
 */
function random (seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}
