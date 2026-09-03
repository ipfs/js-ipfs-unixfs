import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import all from 'it-all'
import { importer, importBytes } from '../src/index.ts'

describe('pb field order', function () {
  describe('data-first', function () {
    const blockstore = new MemoryBlockstore()

    it('small file', async function () {
      const result = await importBytes(
        new TextEncoder().encode('hello\n'),
        blockstore, {
          cidVersion: 1,
          fieldOrder: 'data-first'
        }
      )
      expect(result.cid.toString()).to.equal('bafkreicysg23kiwv34eg2d7qweipxwosdo2py4ldv42nbauguluen5v6am')
    })

    it('directory with small file', async function () {
      const result = await all(importer([{
        content: new TextEncoder().encode('hello\n'),
        path: '/hello.txt'
      }], blockstore, {
        cidVersion: 1,
        fieldOrder: 'data-first',
        wrapWithDirectory: true
      }))

      expect(result[1].cid.toString()).to.equal('bafybeigqvyloizmfcdy6scaxnyltftzptaruqa3hnnplfzsbf4sqteiwlm')
    })

    it('HAMT shard with small file', async function () {
      const result = await all(importer([{
        content: new TextEncoder().encode('hello\n'),
        path: '/hello.txt'
      }], blockstore, {
        cidVersion: 1,
        fieldOrder: 'data-first',
        wrapWithDirectory: true,
        shardSplitThresholdBytes: 0
      }))

      expect(result[1].cid.toString()).to.equal('bafybeicwgy2rlqmqqu3yy2tqvm2wbgdvy3snu4sbbv4wqpvpnoplpzxz74')
    })
  })

  describe('links-first', function () {
    const blockstore = new MemoryBlockstore()

    it('small file', async function () {
      const result = await importBytes(
        new TextEncoder().encode('hello\n'),
        blockstore, {
          cidVersion: 1,
          fieldOrder: 'links-first'
        }
      )
      expect(result.cid.toString()).to.equal('bafkreicysg23kiwv34eg2d7qweipxwosdo2py4ldv42nbauguluen5v6am')
    })

    it('directory with small file', async function () {
      const result = await all(importer([{
        content: new TextEncoder().encode('hello\n'),
        path: '/hello.txt'
      }], blockstore, {
        cidVersion: 1,
        fieldOrder: 'links-first',
        wrapWithDirectory: true
      }))

      expect(result[1].cid.toString()).to.equal('bafybeigdcg7pksx2zk5336vrfsktjodlr4rbfz37qr3koc5xboxe5ekv24')
    })

    it('HAMT shard with small file', async function () {
      const result = await all(importer([{
        content: new TextEncoder().encode('hello\n'),
        path: '/hello.txt'
      }], blockstore, {
        cidVersion: 1,
        fieldOrder: 'links-first',
        wrapWithDirectory: true,
        shardSplitThresholdBytes: 0
      }))

      expect(result[1].cid.toString()).to.equal('bafybeicjwkfslu7gwyywffvqgse5kiibojtktxcdqhgv7ldj5fjdacuceq')
    })
  })
})
