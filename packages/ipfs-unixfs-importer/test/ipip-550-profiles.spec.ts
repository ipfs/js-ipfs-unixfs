/**
 * IPIP-550 CID Profile tests.
 *
 * Verifies that the JS importer produces the same CIDs as kubo for both
 * the unixfs-v1-2026 profile.
 *
 * @see https://github.com/ipfs/specs/pull/550
 */

import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import all from 'it-all'
import { importer, importBytes } from '../src/index.ts'

describe('IPIP-550 CID Profiles', function () {
  // -- unixfs-v1-2026 profile --
  // data-first dag-pb field order

  describe('unixfs-v1-2026', function () {
    const blockstore = new MemoryBlockstore()

    it('small file', async function () {
      const result = await importBytes(
        new TextEncoder().encode('hello\n'),
        blockstore, {
          profile: 'unixfs-v1-2026'
        }
      )
      expect(result.cid.toString()).to.equal('bafkreicysg23kiwv34eg2d7qweipxwosdo2py4ldv42nbauguluen5v6am')
    })

    it('directory with small file', async function () {
      const result = await all(importer([{
        content: new TextEncoder().encode('hello\n'),
        path: '/hello.txt'
      }], blockstore, {
        profile: 'unixfs-v1-2026',
        wrapWithDirectory: true
      }))

      expect(result[1].cid.toString()).to.equal('bafybeigqvyloizmfcdy6scaxnyltftzptaruqa3hnnplfzsbf4sqteiwlm')
    })

    it('HAMT shard with small file', async function () {
      const result = await all(importer([{
        content: new TextEncoder().encode('hello\n'),
        path: '/hello.txt'
      }], blockstore, {
        profile: 'unixfs-v1-2026',
        wrapWithDirectory: true,
        shardSplitThresholdBytes: 0
      }))

      expect(result[1].cid.toString()).to.equal('bafybeicwgy2rlqmqqu3yy2tqvm2wbgdvy3snu4sbbv4wqpvpnoplpzxz74')
    })
  })
})
