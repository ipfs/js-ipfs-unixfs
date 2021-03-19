'use strict'

/**
 * @param {Uint8Array | Uint8Array[]} arr
 */
async function * asAsyncIterable (arr) {
  if (!Array.isArray(arr)) {
    arr = [arr]
  }

  yield * arr
}

module.exports = asAsyncIterable
