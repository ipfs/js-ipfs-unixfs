'use strict'

/**
 * @param {Uint8Array[]} arr
 */
async function * asAsyncIterable (arr) {
  yield * arr
}

module.exports = asAsyncIterable
