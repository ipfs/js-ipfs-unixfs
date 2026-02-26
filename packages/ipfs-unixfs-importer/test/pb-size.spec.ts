import { encode, prepare } from '@ipld/dag-pb'
import { expect } from 'aegir/chai'
import { UnixFS } from 'ipfs-unixfs'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import {
  varintLen,
  utf8ByteLength,
  linkSerializedSize,
  dataFieldSerializedSize
} from '../src/utils/pb-size.js'
import type { PBNode } from '@ipld/dag-pb'

// helper: create a CID from arbitrary bytes for testing
async function fakeCid (version: 0 | 1, bytes: Uint8Array): Promise<CID> {
  const hash = await sha256.digest(bytes)
  return CID.create(version, version === 0 ? 0x70 : 0x55, hash)
}

describe('pb-size', () => {
  describe('varintLen', () => {
    it('returns 1 for small values (0-127)', () => {
      expect(varintLen(0)).to.equal(1)
      expect(varintLen(1)).to.equal(1)
      expect(varintLen(127)).to.equal(1)
    })

    it('returns 2 for values 128-16383', () => {
      expect(varintLen(128)).to.equal(2)
      expect(varintLen(255)).to.equal(2)
      expect(varintLen(16383)).to.equal(2)
    })

    it('returns 3 for values 16384-2097151', () => {
      expect(varintLen(16384)).to.equal(3)
      expect(varintLen(262144)).to.equal(3)
    })

    it('handles large values', () => {
      expect(varintLen(2 ** 32)).to.equal(5)
      expect(varintLen(Number.MAX_SAFE_INTEGER)).to.equal(8)
    })
  })

  describe('utf8ByteLength', () => {
    const textEncoder = new TextEncoder()

    it('counts ASCII strings correctly', () => {
      expect(utf8ByteLength('')).to.equal(0)
      expect(utf8ByteLength('hello')).to.equal(5)
      expect(utf8ByteLength('hello world')).to.equal(11)
    })

    it('matches TextEncoder for ASCII', () => {
      const str = 'abcdefghijklmnopqrstuvwxyz0123456789'
      expect(utf8ByteLength(str)).to.equal(textEncoder.encode(str).length)
    })

    it('counts 2-byte characters correctly', () => {
      // U+00E9 (e-acute) = 2 UTF-8 bytes
      const str = '\u00e9'
      expect(utf8ByteLength(str)).to.equal(2)
      expect(utf8ByteLength(str)).to.equal(textEncoder.encode(str).length)
    })

    it('counts 3-byte characters correctly', () => {
      // U+4E16 (CJK character) = 3 UTF-8 bytes
      const str = '\u4e16'
      expect(utf8ByteLength(str)).to.equal(3)
      expect(utf8ByteLength(str)).to.equal(textEncoder.encode(str).length)
    })

    it('counts surrogate pairs (4-byte characters) correctly', () => {
      // U+1F600 (grinning face emoji) = 4 UTF-8 bytes, stored as surrogate pair
      const str = '\uD83D\uDE00'
      expect(utf8ByteLength(str)).to.equal(4)
      expect(utf8ByteLength(str)).to.equal(textEncoder.encode(str).length)
    })

    it('matches TextEncoder for mixed content', () => {
      const str = 'hello-\u00e9\u4e16\uD83D\uDE00-world'
      expect(utf8ByteLength(str)).to.equal(textEncoder.encode(str).length)
    })
  })

  describe('linkSerializedSize', () => {
    it('matches encode(prepare(node)) for a single CIDv0 link', async () => {
      const cid = await fakeCid(0, new Uint8Array([1, 2, 3]))
      const name = 'test-file.txt'
      const tsize = 1024

      const node: PBNode = {
        Data: new Uint8Array(0),
        Links: [{ Hash: cid, Name: name, Tsize: tsize }]
      }
      const encoded = encode(prepare(node))
      // subtract the empty-data overhead (1 tag + 1 varint + 0 bytes = 2)
      const dataOverhead = 2
      const expected = encoded.byteLength - dataOverhead

      const nameBytes = utf8ByteLength(name)
      expect(linkSerializedSize(nameBytes, cid.byteLength, tsize)).to.equal(expected)
    })

    it('matches encode(prepare(node)) for a single CIDv1 link', async () => {
      const cid = await fakeCid(1, new Uint8Array([4, 5, 6]))
      const name = 'short'
      const tsize = 42

      const node: PBNode = {
        Data: new Uint8Array(0),
        Links: [{ Hash: cid, Name: name, Tsize: tsize }]
      }
      const encoded = encode(prepare(node))
      const dataOverhead = 2
      const expected = encoded.byteLength - dataOverhead

      const nameBytes = utf8ByteLength(name)
      expect(linkSerializedSize(nameBytes, cid.byteLength, tsize)).to.equal(expected)
    })

    it('matches encode(prepare(node)) for multiple links', async () => {
      const cid1 = await fakeCid(1, new Uint8Array([1]))
      const cid2 = await fakeCid(1, new Uint8Array([2]))
      const cid3 = await fakeCid(1, new Uint8Array([3]))

      const links = [
        { Hash: cid1, Name: 'aaa', Tsize: 100 },
        { Hash: cid2, Name: 'bbb', Tsize: 200 },
        { Hash: cid3, Name: 'ccc', Tsize: 300 }
      ]

      const node: PBNode = { Data: new Uint8Array(0), Links: links }
      const encoded = encode(prepare(node))
      const dataOverhead = 2

      const sum = links.reduce((acc, l) => {
        return acc + linkSerializedSize(
          utf8ByteLength(l.Name), l.Hash.byteLength, l.Tsize
        )
      }, 0)

      expect(sum).to.equal(encoded.byteLength - dataOverhead)
    })

    it('handles tsize = 0', async () => {
      const cid = await fakeCid(1, new Uint8Array([7]))
      const name = 'empty'

      const node: PBNode = {
        Data: new Uint8Array(0),
        Links: [{ Hash: cid, Name: name, Tsize: 0 }]
      }
      const encoded = encode(prepare(node))
      const dataOverhead = 2
      const expected = encoded.byteLength - dataOverhead

      expect(linkSerializedSize(utf8ByteLength(name), cid.byteLength, 0)).to.equal(expected)
    })

    it('handles large tsize', async () => {
      const cid = await fakeCid(1, new Uint8Array([8]))
      const name = 'big'
      const tsize = 1_073_741_824 // 1 GiB

      const node: PBNode = {
        Data: new Uint8Array(0),
        Links: [{ Hash: cid, Name: name, Tsize: tsize }]
      }
      const encoded = encode(prepare(node))
      const dataOverhead = 2
      const expected = encoded.byteLength - dataOverhead

      expect(linkSerializedSize(utf8ByteLength(name), cid.byteLength, tsize)).to.equal(expected)
    })
  })

  describe('dataFieldSerializedSize', () => {
    it('returns 4 for a plain directory (no mode, no mtime)', () => {
      const unixfs = new UnixFS({ type: 'directory' })
      const node: PBNode = { Data: unixfs.marshal(), Links: [] }
      const encoded = encode(prepare(node))

      expect(dataFieldSerializedSize()).to.equal(encoded.byteLength)
      expect(dataFieldSerializedSize(undefined, undefined)).to.equal(4)
    })

    it('omits default directory mode (0o755)', () => {
      const unixfs = new UnixFS({ type: 'directory', mode: 0o755 })
      const node: PBNode = { Data: unixfs.marshal(), Links: [] }
      const encoded = encode(prepare(node))

      expect(dataFieldSerializedSize(0o755)).to.equal(encoded.byteLength)
      // should be same as no mode
      expect(dataFieldSerializedSize(0o755)).to.equal(dataFieldSerializedSize())
    })

    it('includes non-default mode', () => {
      const mode = 0o555
      const unixfs = new UnixFS({ type: 'directory', mode })
      const node: PBNode = { Data: unixfs.marshal(), Links: [] }
      const encoded = encode(prepare(node))

      expect(dataFieldSerializedSize(mode)).to.equal(encoded.byteLength)
      expect(dataFieldSerializedSize(mode)).to.be.greaterThan(dataFieldSerializedSize())
    })

    it('includes mtime with seconds only', () => {
      const mtime = { secs: 1000000n }
      const unixfs = new UnixFS({ type: 'directory', mtime })
      const node: PBNode = { Data: unixfs.marshal(), Links: [] }
      const encoded = encode(prepare(node))

      expect(dataFieldSerializedSize(undefined, mtime)).to.equal(encoded.byteLength)
    })

    it('includes mtime with seconds and nanoseconds', () => {
      const mtime = { secs: 1000000n, nsecs: 500000 }
      const unixfs = new UnixFS({ type: 'directory', mtime })
      const node: PBNode = { Data: unixfs.marshal(), Links: [] }
      const encoded = encode(prepare(node))

      expect(dataFieldSerializedSize(undefined, mtime)).to.equal(encoded.byteLength)
    })

    it('matches full directory node size (data + links)', async () => {
      const cid = await fakeCid(1, new Uint8Array([1]))
      const name = 'test'
      const tsize = 42

      const unixfs = new UnixFS({ type: 'directory' })
      const node: PBNode = {
        Data: unixfs.marshal(),
        Links: [{ Hash: cid, Name: name, Tsize: tsize }]
      }
      const encoded = encode(prepare(node))

      const computed = dataFieldSerializedSize() +
        linkSerializedSize(utf8ByteLength(name), cid.byteLength, tsize)

      expect(computed).to.equal(encoded.byteLength)
    })
  })
})
