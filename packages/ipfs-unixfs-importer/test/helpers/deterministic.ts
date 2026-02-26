/**
 * Deterministic pseudo-random byte generation matching kubo's Go test helpers.
 *
 * Algorithm:
 * 1. key = sha256(utf8(seed))  -- 32 bytes
 * 2. nonce = 12 zero bytes (ChaCha20-IETF)
 * 3. return chacha20(key, nonce, zeros(size))  -- keystream XOR zeros = keystream
 *
 * @see https://github.com/ipfs/kubo/blob/master/test/cli/testutils/random_deterministic.go
 */

import { chacha20 } from '@noble/ciphers/chacha'
import { sha256 } from 'multiformats/hashes/sha2'

/**
 * 39-char alphabet matching Go's testutils.AlphabetEasy exactly.
 */
const ALPHABET_EASY = 'abcdefghijklmnopqrstuvwxyz01234567890-_'

const CHACHA20_BLOCK_LEN = 64

/**
 * Produce `size` deterministic pseudo-random bytes seeded by `seed`.
 * Matches Go's DeterministicRandomReaderBytes.
 */
export async function deterministicRandomBytes (size: number, seed: string): Promise<Uint8Array> {
  const hash = await sha256.digest(new TextEncoder().encode(seed))
  const key = hash.digest // 32 bytes
  const nonce = new Uint8Array(12) // 12 zero bytes
  return chacha20(key, nonce, new Uint8Array(size))
}

/**
 * Produce `size` deterministic pseudo-random bytes as an async iterable,
 * yielding in 1 MiB chunks to avoid allocating huge buffers at once.
 * Maintains ChaCha20 block counter across chunks to match Go's streaming reader.
 */
export async function * deterministicRandomStream (size: number, seed: string): AsyncGenerator<Uint8Array> {
  const CHUNK = 1_048_576 // 1 MiB
  const hash = await sha256.digest(new TextEncoder().encode(seed))
  const key = hash.digest
  const nonce = new Uint8Array(12)

  let remaining = size
  let counter = 0
  while (remaining > 0) {
    const n = Math.min(remaining, CHUNK)
    yield chacha20(key, nonce, new Uint8Array(n), undefined, counter)
    counter += Math.ceil(n / CHACHA20_BLOCK_LEN)
    remaining -= n
  }
}

/**
 * Generate deterministic filenames matching kubo's createDeterministicFiles.
 *
 * Files 0..count-2 get `nameLen` chars, the last file gets `lastNameLen` chars.
 * Each byte from the ChaCha20 stream is mapped through AlphabetEasy modulo.
 *
 * Note: the stream is 1 MiB, so total bytes consumed
 * ((count-1)*nameLen + lastNameLen) must not exceed 1,048,576.
 */
export async function deterministicFilenames (
  count: number,
  nameLen: number,
  lastNameLen: number,
  seed: string
): Promise<string[]> {
  // Match Go: DeterministicRandomReader("1MiB", seed) - always 1 MiB stream
  const stream = await deterministicRandomBytes(1_048_576, seed)

  const names: string[] = []
  let offset = 0

  for (let i = 0; i < count; i++) {
    const currentLen = (i === count - 1) ? lastNameLen : nameLen
    let name = ''
    for (let j = 0; j < currentLen; j++) {
      name += ALPHABET_EASY[stream[offset + j] % ALPHABET_EASY.length]
    }
    names.push(name)
    offset += currentLen
  }

  return names
}
