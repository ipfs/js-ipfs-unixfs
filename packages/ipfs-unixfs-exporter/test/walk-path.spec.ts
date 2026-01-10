import * as dagCbor from '@ipld/dag-cbor'
import * as dagJson from '@ipld/dag-json'
import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import { importer } from 'ipfs-unixfs-importer'
import all from 'it-all'
import drain from 'it-drain'
import { CID } from 'multiformats/cid'
import * as json from 'multiformats/codecs/json'
import * as raw from 'multiformats/codecs/raw'
import { identity } from 'multiformats/hashes/identity'
import { sha256 } from 'multiformats/hashes/sha2'
import { walkPath } from '../src/walk-path/index.ts'
import type { Blockstore } from 'interface-blockstore'
import type { BlockCodec } from 'multiformats'

async function store (obj: any, codec: BlockCodec<number, any>, blockstore: Blockstore): Promise<CID> {
  const block = codec.encode(obj)
  const cid = CID.createV1(codec.code, await sha256.digest(block))

  await blockstore.put(cid, block)

  return cid
}

describe('walkPath', () => {
  let blockstore: Blockstore

  beforeEach(() => {
    blockstore = new MemoryBlockstore()
  })

  describe('DAG-CBOR terminal element', () => {
    it('should walk a DAG-CBOR path', async () => {
      const targetCid = await store({
        bar: 'baz'
      }, dagCbor, blockstore)
      const parentCid = await store({
        foo: targetCid
      }, dagCbor, blockstore)

      const results = await all(walkPath(`/ipfs/${parentCid}/foo`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'foo'
        ]
      }, {
        cid: targetCid,
        name: 'foo',
        path: `${parentCid}/foo`,
        roots: [
          parentCid,
          targetCid
        ],
        remainder: []
      }])
    })

    it('should walk a DAG-CBOR path without loading the terminal block', async () => {
      const targetCid = await store({
        bar: 'baz'
      }, dagCbor, blockstore)
      const parentCid = await store({
        foo: targetCid
      }, dagCbor, blockstore)

      await blockstore.delete(targetCid)

      const results = await all(walkPath(`/ipfs/${parentCid}/foo`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'foo'
        ]
      }, {
        cid: targetCid,
        name: 'foo',
        path: `${parentCid}/foo`,
        roots: [
          parentCid,
          targetCid
        ],
        remainder: []
      }])
    })

    it('should walk a deep DAG-CBOR path', async () => {
      const targetCid = await store({
        baz: 'qux'
      }, dagCbor, blockstore)
      const parentCid = await store({
        foo: {
          bar: targetCid
        }
      }, dagCbor, blockstore)

      const results = await all(walkPath(`/ipfs/${parentCid}/foo/bar`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'foo',
          'bar'
        ]
      }, {
        cid: targetCid,
        name: 'foo/bar',
        path: `${parentCid}/foo/bar`,
        roots: [
          parentCid,
          targetCid
        ],
        remainder: []
      }])
    })

    it('should walk a deep DAG-CBOR path with a remainder', async () => {
      const targetCid = await store({
        baz: 'qux'
      }, dagCbor, blockstore)
      const parentCid = await store({
        foo: {
          bar: targetCid
        }
      }, dagCbor, blockstore)

      const results = await all(walkPath(`/ipfs/${parentCid}/foo/bar/baz`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'foo',
          'bar',
          'baz'
        ]
      }, {
        cid: targetCid,
        name: 'foo/bar',
        path: `${parentCid}/foo/bar`,
        roots: [
          parentCid,
          targetCid
        ],
        remainder: [
          'baz'
        ]
      }])
    })

    it('should fail to walk a DAG-CBOR path with a remainder', async () => {
      const parentCid = await store({
        foo: 'bar'
      }, dagCbor, blockstore)

      await expect(all(walkPath(`/ipfs/${parentCid}/foo/bar/qux`, blockstore)))
        .to.eventually.rejected
        .with.property('name', 'BadPathError')
    })

    it('should fail to walk a deep DAG-CBOR path with a remainder', async () => {
      const targetCid = await store({
        baz: 'qux'
      }, dagCbor, blockstore)
      const parentCid = await store({
        foo: {
          bar: targetCid
        }
      }, dagCbor, blockstore)

      await expect(all(walkPath(`/ipfs/${parentCid}/foo/bar/baz/qux/garply`, blockstore)))
        .to.eventually.rejected
        .with.property('name', 'BadPathError')
    })
  })

  describe('DAG-JSON terminal element', () => {
    it('should walk a DAG-JSON path', async () => {
      const targetCid = await store({
        bar: 'baz'
      }, dagJson, blockstore)
      const parentCid = await store({
        foo: targetCid
      }, dagJson, blockstore)

      const results = await all(walkPath(`/ipfs/${parentCid}/foo`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'foo'
        ]
      }, {
        cid: targetCid,
        name: 'foo',
        path: `${parentCid}/foo`,
        roots: [
          parentCid,
          targetCid
        ],
        remainder: []
      }])
    })

    it('should walk a DAG-JSON path without loading the terminal block', async () => {
      const targetCid = await store({
        bar: 'baz'
      }, dagJson, blockstore)
      const parentCid = await store({
        foo: targetCid
      }, dagJson, blockstore)

      await blockstore.delete(targetCid)

      const results = await all(walkPath(`/ipfs/${parentCid}/foo`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'foo'
        ]
      }, {
        cid: targetCid,
        name: 'foo',
        path: `${parentCid}/foo`,
        roots: [
          parentCid,
          targetCid
        ],
        remainder: []
      }])
    })

    it('should walk a deep DAG-JSON path', async () => {
      const targetCid = await store({
        baz: 'qux'
      }, dagJson, blockstore)
      const parentCid = await store({
        foo: {
          bar: targetCid
        }
      }, dagJson, blockstore)

      const results = await all(walkPath(`/ipfs/${parentCid}/foo/bar`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'foo',
          'bar'
        ]
      }, {
        cid: targetCid,
        name: 'foo/bar',
        path: `${parentCid}/foo/bar`,
        roots: [
          parentCid,
          targetCid
        ],
        remainder: []
      }])
    })

    it('should walk a deep DAG-JSON path with a remainder', async () => {
      const targetCid = await store({
        baz: 'qux'
      }, dagJson, blockstore)
      const parentCid = await store({
        foo: {
          bar: targetCid
        }
      }, dagJson, blockstore)

      const results = await all(walkPath(`/ipfs/${parentCid}/foo/bar/baz`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'foo',
          'bar',
          'baz'
        ]
      }, {
        cid: targetCid,
        name: 'foo/bar',
        path: `${parentCid}/foo/bar`,
        roots: [
          parentCid,
          targetCid
        ],
        remainder: [
          'baz'
        ]
      }])
    })
  })

  describe('JSON terminal element', () => {
    it('should walk a JSON path', async () => {
      const targetCid = await store({
        bar: 'baz'
      }, json, blockstore)
      const parentCid = await store({
        foo: targetCid
      }, dagJson, blockstore)

      const results = await all(walkPath(`/ipfs/${parentCid}/foo`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'foo'
        ]
      }, {
        cid: targetCid,
        name: 'foo',
        path: `${parentCid}/foo`,
        roots: [
          parentCid,
          targetCid
        ],
        remainder: []
      }])
    })

    it('should fail to walk a JSON path with a remainder', async () => {
      const parentCid = await store({
        foo: 'bar'
      }, json, blockstore)

      await expect(all(walkPath(`/ipfs/${parentCid}/foo/bar/qux`, blockstore)))
        .to.eventually.rejected
        .with.property('name', 'BadPathError')
    })
  })

  describe('RAW terminal element', () => {
    it('should walk a path that ends at a RAW block', async () => {
      const targetCid = await store(Uint8Array.from([0, 1, 2, 3]), raw, blockstore)
      const parentCid = await store({
        foo: {
          bar: targetCid
        }
      }, dagCbor, blockstore)

      const results = await all(walkPath(`/ipfs/${parentCid}/foo/bar`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'foo',
          'bar'
        ]
      }, {
        cid: targetCid,
        name: 'foo/bar',
        path: `${parentCid}/foo/bar`,
        roots: [
          parentCid,
          targetCid
        ],
        remainder: []
      }])
    })

    it('should fail to walk a path through a RAW block', async () => {
      const targetCid = await store(Uint8Array.from([0, 1, 2, 3]), raw, blockstore)
      const parentCid = await store({
        foo: {
          bar: targetCid
        }
      }, dagCbor, blockstore)

      await expect(all(walkPath(`/ipfs/${parentCid}/foo/bar/baz/qux/garply`, blockstore)))
        .to.eventually.rejected
        .with.property('name', 'NotFoundError')
    })
  })

  describe('identity terminal element', () => {
    it('should walk a path that ends at an identity block', async () => {
      const targetCid = CID.createV1(identity.code, identity.digest(Uint8Array.from([0, 1, 2, 3])))
      const parentCid = await store({
        foo: {
          bar: targetCid
        }
      }, dagCbor, blockstore)

      const results = await all(walkPath(`/ipfs/${parentCid}/foo/bar`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'foo',
          'bar'
        ]
      }, {
        cid: targetCid,
        name: 'foo/bar',
        path: `${parentCid}/foo/bar`,
        roots: [
          parentCid,
          targetCid
        ],
        remainder: []
      }])
    })

    it('should fail to walk a path through an identity block', async () => {
      const targetCid = CID.createV1(identity.code, identity.digest(Uint8Array.from([0, 1, 2, 3])))
      const parentCid = await store({
        foo: {
          bar: targetCid
        }
      }, dagCbor, blockstore)

      await expect(all(walkPath(`/ipfs/${parentCid}/foo/bar/baz/qux/garply`, blockstore)))
        .to.eventually.rejected
        .with.property('name', 'BadPathError')
    })
  })

  describe('dag-pb file terminal element', () => {
    it('should walk to file', async () => {
      const [{ cid: fileCid }, { cid: parentCid }] = await all(importer([{
        path: 'file.txt',
        content: Uint8Array.from([0, 1, 2, 3, 4])
      }], blockstore, {
        wrapWithDirectory: true,
        rawLeaves: false
      }))

      const results = await all(walkPath(`/ipfs/${parentCid}/file.txt`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'file.txt'
        ]
      }, {
        cid: fileCid,
        name: 'file.txt',
        path: `${parentCid}/file.txt`,
        roots: [
          parentCid,
          fileCid
        ],
        remainder: []
      }])
    })

    it('should fail to walk to file that does not exist', async () => {
      const [, { cid: parentCid }] = await all(importer([{
        path: 'file.txt',
        content: Uint8Array.from([0, 1, 2, 3, 4])
      }], blockstore, {
        wrapWithDirectory: true,
        rawLeaves: false
      }))

      await expect(drain(walkPath(`/ipfs/${parentCid}/does-not-exist.txt`, blockstore))).to.eventually.be.rejected
        .with.property('name', 'NotFoundError')
    })

    it('should fail to walk to file in hamt shard that does not exist', async () => {
      const [, { cid: parentCid }] = await all(importer([{
        path: 'file.txt',
        content: Uint8Array.from([0, 1, 2, 3, 4])
      }], blockstore, {
        shardSplitThresholdBytes: 0,
        wrapWithDirectory: true,
        rawLeaves: false
      }))

      await expect(drain(walkPath(`/ipfs/${parentCid}/does-not-exist.txt`, blockstore))).to.eventually.be.rejected
        .with.property('name', 'NotFoundError')
    })

    it('should walk to file without loading sibling blocks', async () => {
      const [{ cid: fileCid }, { cid: siblingCid }, { cid: parentCid }] = await all(importer([{
        path: 'file.txt',
        content: Uint8Array.from([0, 1, 2, 3, 4])
      }, {
        path: 'sibling.txt',
        content: Uint8Array.from([5, 6, 7, 8, 9])
      }], blockstore, {
        wrapWithDirectory: true,
        rawLeaves: false
      }))

      await blockstore.delete(siblingCid)

      const results = await all(walkPath(`/ipfs/${parentCid}/file.txt`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'file.txt'
        ]
      }, {
        cid: fileCid,
        name: 'file.txt',
        path: `${parentCid}/file.txt`,
        roots: [
          parentCid,
          fileCid
        ],
        remainder: []
      }])
    })

    it('should walk to file in a HAMT shard', async () => {
      const [{ cid: fileCid }, { cid: parentCid }] = await all(importer([{
        path: 'file.txt',
        content: Uint8Array.from([0, 1, 2, 3, 4])
      }], blockstore, {
        wrapWithDirectory: true,
        rawLeaves: false,
        shardSplitThresholdBytes: 0
      }))

      const results = await all(walkPath(`/ipfs/${parentCid}/file.txt`, blockstore))

      expect(results).to.deep.equal([{
        cid: parentCid,
        name: `${parentCid}`,
        path: `${parentCid}`,
        roots: [
          parentCid
        ],
        remainder: [
          'file.txt'
        ]
      }, {
        cid: fileCid,
        name: 'file.txt',
        path: `${parentCid}/file.txt`,
        roots: [
          parentCid,
          fileCid
        ],
        remainder: []
      }])
    })
  })
})
