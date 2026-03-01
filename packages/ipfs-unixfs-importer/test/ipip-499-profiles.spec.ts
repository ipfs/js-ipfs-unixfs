/**
 * IPIP-499 CID Profile tests.
 *
 * Verifies that the JS importer produces the same CIDs as kubo for both
 * the legacy (unixfs-v0-2015) and recommended (unixfs-v1-2025) profiles.
 *
 * Key differences between profiles:
 *
 * | parameter          | unixfs-v0-2015       | unixfs-v1-2025       |
 * |--------------------|----------------------|----------------------|
 * | CID version        | 0                    | 1                    |
 * | raw leaves         | false (dag-pb wrap)  | true                 |
 * | chunk size          | 256 KiB              | 1 MiB                |
 * | max links/node     | 174                  | 1024                 |
 * | shard split strategy | links-bytes          | block-bytes          |
 * | HAMT threshold     | 256 KiB              | 256 KiB              |
 *
 * The shard split strategy determines how directory size is estimated when
 * deciding whether to convert from a flat directory to a HAMT shard:
 *
 * - links-bytes: size = sum(link_name_len + cid_byte_len) for each entry.
 * Fast but underestimates -- ignores protobuf framing overhead.
 *
 * - block-bytes: size = exact protobuf serialized byte length.
 * Accurate, computed arithmetically (see src/utils/pb-size.ts).
 *
 * Expected CIDs are taken from kubo's cid_profiles_test.go.
 *
 * @see https://github.com/ipfs/kubo/blob/master/test/cli/cid_profiles_test.go
 * @see https://github.com/ipfs/specs/pull/499
 */

import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import last from 'it-last'
import { importer, importBytes, importDirectory } from '../src/index.js'
import { deterministicRandomBytes, deterministicRandomStream, deterministicFilenames } from './helpers/deterministic.ts'
import type { ImporterOptions } from '../src/index.js'

// Profile option presets matching kubo's cidProfileExpectations.
// v0 uses links-bytes shard estimation, v1 uses block-bytes.
const v0Options: ImporterOptions = { profile: 'unixfs-v0-2015' }
const v1Options: ImporterOptions = { profile: 'unixfs-v1-2025' }

describe('IPIP-499 CID Profiles', function () {
  // Pre-compute deterministic filenames once (shared across tests)
  let v0Names4096: string[]
  let v0Names4033: string[]
  let v1Names4766Len21: string[]
  let v1Names4766Len22: string[]

  before(async function () {
    v0Names4096 = await deterministicFilenames(4096, 30, 30, 'hamt-unixfs-v0-2015')
    v0Names4033 = await deterministicFilenames(4033, 31, 31, 'hamt-unixfs-v0-2015')
    v1Names4766Len21 = await deterministicFilenames(4766, 11, 21, 'hamt-unixfs-v1-2025')
    v1Names4766Len22 = await deterministicFilenames(4766, 11, 22, 'hamt-unixfs-v1-2025')
  })

  // -- unixfs-v0-2015 profile --
  // CIDv0, dag-pb wrapped leaves, 256 KiB chunks, 174 max links,
  // links-bytes shard estimation

  describe('unixfs-v0-2015', function () {
    const blockstore = new MemoryBlockstore()
    it('small file ("hello world")', async function () {
      const result = await importBytes(
        new TextEncoder().encode('hello world'),
        blockstore, v0Options
      )
      expect(result.cid.toString()).to.equal('Qmf412jQZiuVUtdgnB36FXFX7xg5V6KEbSJ4dpQuhkLyfD')
    })

    it('file at chunk size (262144 bytes)', async function () {
      const data = await deterministicRandomBytes(262_144, 'chunk-v0-seed')
      const result = await importBytes(data, blockstore, v0Options)
      expect(result.cid.toString()).to.equal('QmWmRj3dFDZdb6ABvbmKhEL6TmPbAfBZ1t5BxsEyJrcZhE')
    })

    it('file over chunk size (262145 bytes)', async function () {
      const data = await deterministicRandomBytes(262_145, 'chunk-v0-seed')
      const result = await importBytes(data, blockstore, v0Options)
      expect(result.cid.toString()).to.equal('QmYyLxtzZyW22zpoVAtKANLRHpDjZtNeDjQdJrcQNWoRkJ')
    })

    it('file at max links (174 x 256 KiB)', async function () {
      const size = 174 * 262_144
      const result = await importBytes(
        { [Symbol.asyncIterator]: () => deterministicRandomStream(size, 'v0-seed')[Symbol.asyncIterator]() },
        blockstore, v0Options
      )
      expect(result.cid.toString()).to.equal('QmUbBALi174SnogsUzLpYbD4xPiBSFANF4iztWCsHbMKh2')
    })

    it('file over max links (174 x 256 KiB + 1)', async function () {
      const size = 174 * 262_144 + 1
      const result = await importBytes(
        { [Symbol.asyncIterator]: () => deterministicRandomStream(size, 'v0-seed')[Symbol.asyncIterator]() },
        blockstore, v0Options
      )
      expect(result.cid.toString()).to.equal('QmV81WL765sC8DXsRhE5fJv2rwhS4icHRaf3J9Zk5FdRnW')
    })

    // Directory tests use links-bytes shard estimation (v0 profile default).
    // links-bytes size = sum(name_len + cid_byte_len) per entry.
    // CIDv0 is 34 bytes, so links-bytes = num_files * (name_len + 34).

    it('directory at HAMT threshold (basic flat dir, links-bytes)', async function () {
      // 4096 files * (30 + 34) = 262,144 bytes -- exactly at threshold, stays basic
      const source = v0Names4096.map(name => ({
        path: `rootDir/${name}`,
        content: new Uint8Array([120]) // "x"
      }))

      const result = await last(importer(source, blockstore, v0Options))
      expect(result).to.not.be.null()
      expect(result!.unixfs?.type).to.equal('directory')
      expect(result!.cid.toString()).to.equal('QmX5GtRk3TSSEHtdrykgqm4eqMEn3n2XhfkFAis5fjyZmN')
    })

    it('directory over HAMT threshold (HAMT sharded, links-bytes)', async function () {
      // 4033 files * (31 + 34) = 262,145 bytes -- 1 byte over threshold, becomes HAMT
      const source = v0Names4033.map(name => ({
        path: `rootDir/${name}`,
        content: new Uint8Array([120]) // "x"
      }))

      const result = await last(importer(source, blockstore, v0Options))
      expect(result).to.not.be.null()
      expect(result!.unixfs?.type).to.equal('hamt-sharded-directory')
      expect(result!.cid.toString()).to.equal('QmeMiJzmhpJAUgynAcxTQYek5PPKgdv3qEvFsdV3XpVnvP')
    })
  })

  // -- unixfs-v1-2025 profile --
  // CIDv1, raw leaves, 1 MiB chunks, 1024 max links,
  // block-bytes shard estimation (actual protobuf serialized size)

  describe('unixfs-v1-2025', function () {
    const blockstore = new MemoryBlockstore()

    it('small file ("hello world")', async function () {
      const result = await importBytes(
        new TextEncoder().encode('hello world'),
        blockstore, v1Options
      )
      expect(result.cid.toString()).to.equal('bafkreifzjut3te2nhyekklss27nh3k72ysco7y32koao5eei66wof36n5e')
    })

    it('file at chunk size (1048576 bytes)', async function () {
      const data = await deterministicRandomBytes(1_048_576, 'chunk-v1-seed')
      const result = await importBytes(data, blockstore, v1Options)
      expect(result.cid.toString()).to.equal('bafkreiacndfy443ter6qr2tmbbdhadvxxheowwf75s6zehscklu6ezxmta')
    })

    it('file over chunk size (1048577 bytes)', async function () {
      const data = await deterministicRandomBytes(1_048_577, 'chunk-v1-seed')
      const result = await importBytes(data, blockstore, v1Options)
      expect(result.cid.toString()).to.equal('bafybeigmix7t42i6jacydtquhet7srwvgpizfg7gjbq7627d35mjomtu64')
    })

    it('file at max links (1024 x 1 MiB)', async function () {
      this.timeout(120_000)
      const size = 1024 * 1_048_576
      const result = await importBytes(
        { [Symbol.asyncIterator]: () => deterministicRandomStream(size, 'v1-2025-seed')[Symbol.asyncIterator]() },
        blockstore, v1Options
      )
      expect(result.cid.toString()).to.equal('bafybeihmf37wcuvtx4hpu7he5zl5qaf2ineo2lqlfrapokkm5zzw7zyhvm')
    })

    it('file over max links (1024 x 1 MiB + 1)', async function () {
      this.timeout(120_000)
      const size = 1024 * 1_048_576 + 1
      const result = await importBytes(
        { [Symbol.asyncIterator]: () => deterministicRandomStream(size, 'v1-2025-seed')[Symbol.asyncIterator]() },
        blockstore, v1Options
      )
      expect(result.cid.toString()).to.equal('bafybeibdsi225ugbkmpbdohnxioyab6jsqrmkts3twhpvfnzp77xtzpyhe')
    })

    // Directory tests use block-bytes shard estimation (v1 profile default).
    // block-bytes size = exact protobuf serialized byte length of the
    // directory node, computed arithmetically (see src/utils/pb-size.ts).
    //
    // File counts and name lengths are chosen so that the serialized protobuf
    // size hits exact threshold boundaries:
    //   at threshold:   4765 files * LinkSize(11-char, CIDv1) + 1 file * LinkSize(21-char, CIDv1) + 4 bytes overhead = 262,144
    //   over threshold: 4765 files * LinkSize(11-char, CIDv1) + 1 file * LinkSize(22-char, CIDv1) + 4 bytes overhead = 262,145

    it('directory at HAMT threshold (basic flat dir, block-bytes)', async function () {
      const source = v1Names4766Len21.map(name => ({
        path: `rootDir/${name}`,
        content: new Uint8Array([120]) // "x"
      }))

      const result = await last(importer(source, blockstore, v1Options))
      expect(result).to.not.be.null()
      expect(result!.unixfs?.type).to.equal('directory')
      expect(result!.cid.toString()).to.equal('bafybeic3h7rwruealwxkacabdy45jivq2crwz6bufb5ljwupn36gicplx4')
    })

    it('directory over HAMT threshold (HAMT sharded, block-bytes)', async function () {
      const source = v1Names4766Len22.map(name => ({
        path: `rootDir/${name}`,
        content: new Uint8Array([120]) // "x"
      }))

      const result = await last(importer(source, blockstore, v1Options))
      expect(result).to.not.be.null()
      expect(result!.unixfs?.type).to.equal('hamt-sharded-directory')
      expect(result!.cid.toString()).to.equal('bafybeiegvuterwurhdtkikfhbxcldohmxp566vpjdofhzmnhv6o4freidu')
    })
  })

  // -- Profile option overrides --

  describe('profile option overrides', function () {
    const blockstore = new MemoryBlockstore()

    it('profile with cidVersion override produces CIDv0 root for multi-chunk file', async function () {
      // rawLeaves forces leaf CIDs to v1 (raw codec can't be CIDv0), but the
      // root dag-pb node should respect the explicit cidVersion: 0 override.
      const data = await deterministicRandomBytes(1_048_577, 'chunk-v1-seed')
      const result = await importBytes(data, blockstore, {
        profile: 'unixfs-v1-2025',
        cidVersion: 0
      })
      expect(result.cid.version).to.equal(0)
      expect(result.cid.toString()).to.match(/^Qm/)
    })

    it('profile with rawLeaves override disables raw leaves', async function () {
      const result = await importBytes(
        new TextEncoder().encode('hello world'),
        blockstore,
        { profile: 'unixfs-v1-2025', rawLeaves: false }
      )
      // Without rawLeaves, small files are dag-pb wrapped (CIDv1 dag-pb)
      expect(result.cid.toString()).to.match(/^bafy/)
    })
  })

  // -- Empty directory CIDs --

  describe('empty directory CIDs', function () {
    const blockstore = new MemoryBlockstore()

    it('empty directory with v0 profile', async function () {
      const result = await importDirectory(
        { path: 'emptyDir' },
        blockstore,
        v0Options
      )
      expect(result.cid.toString()).to.equal('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
    })

    it('empty directory with v1 profile', async function () {
      const result = await importDirectory(
        { path: 'emptyDir' },
        blockstore,
        v1Options
      )
      expect(result.cid.toString()).to.equal('bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354')
    })
  })

  // -- Shard split strategy: links-bytes vs block-bytes --
  //
  // These tests directly compare the two strategies on identical directory
  // content, showing they produce different results near the threshold.

  describe('shard split strategy divergence', function () {
    const blockstore = new MemoryBlockstore()

    it('same directory stays basic with links-bytes but becomes HAMT with block-bytes', async function () {
      // Using the v1-2025 over-threshold directory (4766 files, 11-char + last 22-char).
      //
      // links-bytes estimate: 4765*(11+36) + 1*(22+36) = 224,010
      //   224,010 < 262,144 threshold -> stays flat directory
      //
      // block-bytes (actual protobuf): 262,145
      //   262,145 > 262,144 threshold -> converts to HAMT
      //
      // This demonstrates that the two strategies disagree for the same content
      // because links-bytes ignores protobuf framing overhead.
      const source = v1Names4766Len22.map(name => ({
        path: `rootDir/${name}`,
        content: new Uint8Array([120]) // "x"
      }))

      const linksResult = await last(importer([...source], blockstore, {
        cidVersion: 1,
        rawLeaves: true,
        shardSplitStrategy: 'links-bytes'
      }))
      expect(linksResult).to.not.be.null()
      expect(linksResult!.unixfs?.type).to.equal('directory')

      const blockResult = await last(importer([...source], blockstore, {
        cidVersion: 1,
        rawLeaves: true,
        shardSplitStrategy: 'block-bytes'
      }))
      expect(blockResult).to.not.be.null()
      expect(blockResult!.unixfs?.type).to.equal('hamt-sharded-directory')

      expect(linksResult!.cid.toString()).to.not.equal(blockResult!.cid.toString())
    })
  })

  // -- Shard split threshold boundary tests --
  //
  // Verify that both estimation strategies correctly flip from flat directory
  // to HAMT at the 256 KiB threshold (sharding happens when size > threshold,
  // not >=).

  describe('shard split threshold boundaries', function () {
    const blockstore = new MemoryBlockstore()

    it('links-bytes: at threshold stays basic, +1 byte over becomes HAMT', async function () {
      // links-bytes = 4096 * (30 + 34) = 262,144 -- at threshold, stays basic
      const sourceBasic = v0Names4096.map(name => ({
        path: `rootDir/${name}`,
        content: new Uint8Array([120])
      }))
      const basicResult = await last(importer(sourceBasic, blockstore, {
        cidVersion: 0,
        rawLeaves: false,
        shardSplitStrategy: 'links-bytes'
      }))
      expect(basicResult!.unixfs?.type).to.equal('directory')

      // links-bytes = 4033 * (31 + 34) = 262,145 -- 1 byte over, becomes HAMT
      const sourceHamt = v0Names4033.map(name => ({
        path: `rootDir/${name}`,
        content: new Uint8Array([120])
      }))
      const hamtResult = await last(importer(sourceHamt, blockstore, {
        cidVersion: 0,
        rawLeaves: false,
        shardSplitStrategy: 'links-bytes'
      }))
      expect(hamtResult!.unixfs?.type).to.equal('hamt-sharded-directory')
    })

    it('block-bytes: small directory stays basic', async function () {
      // 5 files with 3-char names -- well under 256 KiB threshold
      const names = ['aaa', 'bbb', 'ccc', 'ddd', 'eee']
      const source = names.map(name => ({
        path: `rootDir/${name}`,
        content: new Uint8Array([120])
      }))

      const result = await last(importer(source, blockstore, {
        ...v1Options,
        shardSplitStrategy: 'block-bytes'
      }))

      expect(result).to.not.be.null()
      expect(result!.unixfs?.type).to.equal('directory')
    })
  })
})
