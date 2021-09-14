import mergeOptions from 'merge-options'
import { sha256 } from 'multiformats/hashes/sha2'
import { murmur3128 } from '@multiformats/murmur3'

/**
 * @param {Uint8Array} buf
 */
async function hamtHashFn (buf) {
  return (await murmur3128.encode(buf))
    // Murmur3 outputs 128 bit but, accidentally, IPFS Go's
    // implementation only uses the first 64, so we must do the same
    // for parity..
    .slice(0, 8)
    // Invert buffer because that's how Go impl does it
    .reverse()
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
  hasher: sha256,
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
  recursive: false,
  hidden: false,
  timeout: undefined,
  hamtHashFn,
  hamtHashCode: 0x22,
  hamtBucketBits: 8
}

/**
 * @param {UserImporterOptions} options
 * @returns {ImporterOptions}
 */
export default (options = {}) => {
  const defaults = mergeOptions.bind({ ignoreUndefined: true })
  return defaults(defaultOptions, options)
}
