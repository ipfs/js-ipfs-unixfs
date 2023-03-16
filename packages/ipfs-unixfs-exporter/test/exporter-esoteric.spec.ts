/* eslint-env mocha */

import { expect } from 'aegir/chai'
import all from 'it-all'
import { MemoryBlockstore } from 'blockstore-core'
import { concat, concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { exporter } from './../src/index.js'
import randomBytes from 'iso-random-stream/src/random.js'
import { sha256 } from 'multiformats/hashes/sha2'
import { CID } from 'multiformats/cid'
import * as raw from 'multiformats/codecs/raw'
import { UnixFS } from 'ipfs-unixfs'
import * as dagPb from '@ipld/dag-pb'
import type { Blockstore } from 'interface-blockstore'

describe('exporter esoteric DAGs', () => {
  let block: Blockstore

  beforeEach(() => {
    block = new MemoryBlockstore()
  })

  async function storeBlock (buf: Uint8Array, codec: number): Promise<CID> {
    const mh = await sha256.digest(buf)
    const cid = CID.createV1(codec, mh)

    await block.put(cid, buf)

    return cid
  }

  it('exports an uneven DAG', async () => {
    const leaves = await Promise.all([
      randomBytes(5),
      randomBytes(3),
      randomBytes(6),
      randomBytes(10),
      randomBytes(4),
      randomBytes(7),
      randomBytes(8)
    ].map(async buf => {
      return {
        cid: await storeBlock(buf, raw.code),
        buf
      }
    }))

    // create an unbalanced DAG:
    //
    //        root
    //    /   |   |    \
    //   0    *   5    6
    //     /  |  \
    //    1   *   4
    //      /   \
    //     2     3

    const intermediateNode1 = {
      Data: new UnixFS({ type: 'file', blockSizes: [
        BigInt(leaves[2].buf.byteLength),
        BigInt(leaves[3].buf.byteLength)
      ]}).marshal(),
      Links: [{
        Name: '',
        Hash: leaves[2].cid,
        Tsize: leaves[2].buf.byteLength,
      }, {
        Name: '',
        Hash: leaves[3].cid,
        Tsize: leaves[3].buf.byteLength,
      }]
    }
    const intermediateNode1Buf = dagPb.encode(intermediateNode1)
    const intermediateNode1Cid = await storeBlock(intermediateNode1Buf, dagPb.code)

    const intermediateNode2 = {
      Data: new UnixFS({ type: 'file', blockSizes: [
        BigInt(leaves[1].buf.byteLength),
        BigInt(leaves[2].buf.byteLength + leaves[3].buf.byteLength),
        BigInt(leaves[4].buf.byteLength)
      ]}).marshal(),
      Links: [{
        Name: '',
        Hash: leaves[1].cid,
        Tsize: leaves[1].buf.byteLength,
      }, {
        Name: '',
        Hash: intermediateNode1Cid,
        Tsize: intermediateNode1Buf.length,
      }, {
        Name: '',
        Hash: leaves[4].cid,
        Tsize: leaves[4].buf.byteLength,
      }]
    }

    const intermediateNode2Buf = dagPb.encode(intermediateNode2)
    const intermediateNode2Cid = await storeBlock(intermediateNode2Buf, dagPb.code)

    const unixfs = new UnixFS({ type: 'file', blockSizes: [
      BigInt(leaves[0].buf.byteLength),
      BigInt(leaves[1].buf.byteLength + leaves[2].buf.byteLength + leaves[3].buf.byteLength + leaves[4].buf.byteLength),
      BigInt(leaves[5].buf.byteLength),
      BigInt(leaves[6].buf.byteLength)
    ]})

    const rootNode = {
      Data: unixfs.marshal(),
      Links: [{
        Name: '',
        Hash: leaves[0].cid,
        Tsize: leaves[0].buf.byteLength,
      }, {
        Name: '',
        Hash: intermediateNode2Cid,
        Tsize: intermediateNode2Buf.byteLength,
      }, {
        Name: '',
        Hash: leaves[5].cid,
        Tsize: leaves[5].buf.byteLength,
      }, {
        Name: '',
        Hash: leaves[6].cid,
        Tsize: leaves[6].buf.byteLength,
      }]
    }

    const rootBuf = dagPb.encode(rootNode)
    const rootCid = await storeBlock(rootBuf, dagPb.code)
    const exported = await exporter(rootCid, block)

    if (exported.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(exported.content()))
    expect(data).to.deep.equal(concat(
      leaves.map(l => l.buf)
    ))
  })

  it('exports a very deep DAG', async () => {
    const buf: Uint8Array = randomBytes(5)
    let child = {
      cid: await storeBlock(buf, raw.code),
      buf
    }

    // create a very deep DAG:
    //
    // root
    //   \
    //     *
    //      \
    //        *
    //         \
    //          ... many nodes here
    //           \
    //             0
    let rootCid: CID | undefined

    for (let i = 0; i < 100000; i++) {
      const parent = {
        Data: new UnixFS({ type: 'file', blockSizes: [
          BigInt(buf.byteLength)
        ]}).marshal(),
        Links: [{
          Name: '',
          Hash: child.cid,
          Tsize: child.buf.byteLength,
        }]
      }

      const parentBuf = dagPb.encode(parent)
      rootCid = await storeBlock(parentBuf, dagPb.code)

      child = {
        cid: rootCid,
        buf: parentBuf
      }
    }

    if (rootCid == null) {
      throw new Error('Root CID not set')
    }

    const exported = await exporter(rootCid, block)

    if (exported.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(exported.content()))
    expect(data).to.deep.equal(buf)
  })
})
