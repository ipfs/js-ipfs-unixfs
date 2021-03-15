'use strict'

const mergeOptions = require('merge-options').bind({ ignoreUndefined: true })
const multihashing = require('multihashing-async')

/**
 * @param {Uint8Array} buf
 */
async function hamtHashFn (buf) {
  const hash = await multihashing(buf, 'murmur3-128')

  // Multihashing inserts preamble of 2 bytes. Remove it.
  // Also, murmur3 outputs 128 bit but, accidentally, IPFS Go's
  // implementation only uses the first 64, so we must do the same
  // for parity..
  const justHash = hash.slice(2, 10)
  const length = justHash.length
  const result = new Uint8Array(length)
  // TODO: invert buffer because that's how Go impl does it
  for (let i = 0; i < length; i++) {
    result[length - i - 1] = justHash[i]
  }

  return result
}

/**
 * @typedef {import('./types').UserImporterOptions} UserImporterOptions
 * @typedef {import('./types').ImporterOptions} ImporterOptions
 */

/**
 * @type {ImporterOptions}
 */
const defaultOptions = {
  chunker: 'fixed',
  strategy: 'balanced', // 'flat', 'trickle'
  rawLeaves: false,
  onlyHash: false,
  reduceSingleLeafToSelf: true,
  hashAlg: 'sha2-256',
  leafType: 'file', // 'raw'
  cidVersion: 0,
  progress: () => () => {},
  shardSplitThreshold: 1000,
  fileImportConcurrency: 50,
  blockWriteConcurrency: 10,
  minChunkSize: 262144,
  maxChunkSize: 262144,
  avgChunkSize: 262144,
  window: 16,
  // FIXME: This number is too big for JavaScript
  // https://github.com/ipfs/go-ipfs-chunker/blob/d0125832512163708c0804a3cda060e21acddae4/rabin.go#L11
  polynomial: 17437180132763653, // eslint-disable-line no-loss-of-precision
  maxChildrenPerNode: 174,
  layerRepeat: 4,
  wrapWithDirectory: false,
  pin: false,
  recursive: false,
  hidden: false,
  preload: false,
  timeout: undefined,
  hamtHashFn,
  hamtHashCode: 0x22,
  hamtBucketBits: 8
}

/**
 * @param {UserImporterOptions} options
 * @returns {ImporterOptions}
 */
module.exports = function (options = {}) {
  return mergeOptions(defaultOptions, options)
}
