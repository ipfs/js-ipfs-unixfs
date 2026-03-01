/**
 * Protobuf size calculation utilities for DAG-PB nodes.
 *
 * Computes exact serialized sizes matching @ipld/dag-pb's encoding
 * without allocating byte arrays. Used by DirFlat to avoid O(N)
 * re-serialization on every file insert.
 *
 * Ported from @ipld/dag-pb/src/pb-encode.js (sov, len64, sizeLink, sizeNode)
 * and boxo's directory.go estimatedSize logic.
 */

import type { Mtime } from 'ipfs-unixfs'

// --- varint helpers (from @ipld/dag-pb/src/pb-encode.js:166-214) ---

const maxInt32 = 2 ** 32

const len8tab = [
  0, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
  8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
  8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
  8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
  8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
  8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
  8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
  8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8
]

function len64 (x: number): number {
  let n = 0
  if (x >= maxInt32) {
    x = Math.floor(x / maxInt32)
    n = 32
  }
  if (x >= (1 << 16)) {
    x >>>= 16
    n += 16
  }
  if (x >= (1 << 8)) {
    x >>>= 8
    n += 8
  }
  return n + len8tab[x]
}

/**
 * Protobuf varint byte size, matching @ipld/dag-pb's sov().
 */
export function varintLen (x: number): number {
  if (x % 2 === 0) {
    x++
  }
  return Math.floor((len64(x) + 6) / 7)
}

/**
 * Compute UTF-8 byte length of a JS string without allocation.
 *
 * Safe to assume UTF-8 because @ipld/dag-pb always encodes PBLink.Name
 * via TextEncoder (UTF-8) and decodes via TextDecoder (UTF-8).
 * This produces the same result as textEncoder.encode(str).length
 * without the Uint8Array allocation on every put() call.
 */
export function utf8ByteLength (str: string): number {
  let len = 0
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    if (c < 0x80) {
      // ASCII: 1 UTF-8 byte
      len++
    } else if (c < 0x800) {
      // U+0080 - U+07FF: 2 UTF-8 bytes
      len += 2
    } else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < str.length) {
      // Surrogate pair (JS encodes code points above U+FFFF as two
      // UTF-16 surrogates). The pair maps to one code point that takes
      // 4 UTF-8 bytes. Lone surrogates cannot occur here because names
      // always round-trip through @ipld/dag-pb's TextEncoder/TextDecoder
      // which only produce valid UTF-8 strings.
      i++
      len += 4
    } else {
      // U+0800 - U+FFFF: 3 UTF-8 bytes
      len += 3
    }
  }
  return len
}

/**
 * Exact bytes a single PBLink adds to the PBNode encoding.
 *
 * Matches sizeLink() + its wrapper in sizeNode() from pb-encode.js:
 * linkLen = Hash(1+sov(cidLen)+cidLen) + Name(1+sov(nameLen)+nameLen) + Tsize(1+sov(tsize))
 * total   = 1 + sov(linkLen) + linkLen
 */
export function linkSerializedSize (nameByteLen: number, cidByteLength: number, tsize: number): number {
  // Hash field: tag(1) + varint(cidLen) + cidBytes
  let linkLen = 1 + varintLen(cidByteLength) + cidByteLength
  // Name field: tag(1) + varint(nameLen) + nameBytes
  linkLen += 1 + varintLen(nameByteLen) + nameByteLen
  // Tsize field: tag(1) + varint(tsize)
  linkLen += 1 + varintLen(tsize)
  // PBNode Links wrapper: tag(1) + varint(linkLen) + linkBytes
  return 1 + varintLen(linkLen) + linkLen
}

// Default mode for directories (0o755 = 493)
const DIR_DEFAULT_MODE = 0o755

/**
 * Exact bytes the PBNode Data field adds for a UnixFS directory.
 *
 * Directory-only: the type field is hardcoded to directory (2 bytes) and
 * the default mode is 0o755. Do not use for file nodes (different type
 * byte, different default mode 0o644).
 *
 * For the common case (no mode, no mtime) this is always 4 bytes:
 * innerSize=2 [0x08,0x01], wrapper 1+1+2=4.
 */
export function dataFieldSerializedSize (mode?: number, mtime?: Mtime): number {
  // UnixFS inner: type field [0x08, 0x01] = 2 bytes for directory
  let innerSize = 2

  // mode (field 7, varint) -- only encoded if set and not the default
  if (mode !== undefined && mode !== DIR_DEFAULT_MODE) {
    innerSize += 1 + varintLen(mode)
  }

  // mtime (field 8, nested UnixTime message)
  if (mtime != null) {
    let mtimeInner = 0
    // Seconds (field 1, int64 varint)
    const secs = Number(mtime.secs)
    if (secs < 0) {
      // negative int64 always takes 10 bytes in protobuf two's complement
      mtimeInner += 1 + 10
    } else {
      mtimeInner += 1 + varintLen(secs)
    }
    // FractionalNanoseconds (field 2, fixed32) -- optional
    if (mtime.nsecs != null) {
      mtimeInner += 1 + 4
    }
    innerSize += 1 + varintLen(mtimeInner) + mtimeInner
  }

  // PBNode Data wrapper: tag(1) + varint(innerSize) + innerBytes
  return 1 + varintLen(innerSize) + innerSize
}
