/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import { importer } from 'ipfs-unixfs-importer'
import all from 'it-all'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { exporter } from '../src/index.js'
import asAsyncIterable from './helpers/as-async-iterable.js'
import type { UnixFSEntry } from '../src/index.js'
import type { CID } from 'multiformats/cid'

describe('import and export: directory', () => {
  const rootHash = 'QmdCrquDwd7RfZ6GCZFEVADwe8uyyw1YmF9mtAB7etDgmK'
  const block = new MemoryBlockstore()

  it('imports', async function () {
    this.timeout(20 * 1000)

    const source = [{
      path: 'a/b/c/d/e',
      content: asAsyncIterable(uint8ArrayFromString('banana'))
    }, {
      path: 'a/b/c/d/f',
      content: asAsyncIterable(uint8ArrayFromString('strawberry'))
    }, {
      path: 'a/b/g',
      content: asAsyncIterable(uint8ArrayFromString('ice'))
    }, {
      path: 'a/b/h',
      content: asAsyncIterable(uint8ArrayFromString('cream'))
    }]

    const files = await all(importer(source, block, {
      rawLeaves: false,
      cidVersion: 0
    }))

    expect(files.map(normalizeNode).sort(byPath)).to.be.eql([{
      path: 'a/b/h',
      multihash: 'QmWHMpCtdNjemT2F3SjyrmnBXQXwEohaZd4apcbFBhbFRC'
    }, {
      path: 'a/b/g',
      multihash: 'QmQGwYzzTPcbqTiy2Nbp88gqqBqCWY4QZGfen45LFZkD5n'
    }, {
      path: 'a/b/c/d/f',
      multihash: 'QmNVHs2dy7AjGUotsubWVncRsD3SpRXm8MgmCCQTVdVACz'
    }, {
      path: 'a/b/c/d/e',
      multihash: 'QmYPbDKwc7oneCcEc6BcRSN5GXthTGWUCd19bTCyP9u3vH'
    }, {
      path: 'a/b/c/d',
      multihash: 'QmQGDXr3ysARM38n7h79Tx7yD3YxuzcnZ1naG71WMojPoj'
    }, {
      path: 'a/b/c',
      multihash: 'QmYTVcjYpN3hQLtJstCPE8hhEacAYjWAuTmmAAXoonamuE'
    }, {
      path: 'a/b',
      multihash: 'QmWyWYxq1GD9fEyckf5LrJv8hMW35CwfWwzDBp8bTw3NQj'
    }, {
      path: 'a',
      multihash: rootHash
    }])
  })

  it('exports', async function () {
    this.timeout(20 * 1000)

    const dir = await exporter(rootHash, block)
    const files = await recursiveExport(dir, rootHash)

    expect(files.sort(byPath)).to.eql([{
      path: 'QmdCrquDwd7RfZ6GCZFEVADwe8uyyw1YmF9mtAB7etDgmK/b/h',
      content: 'cream'
    }, {
      path: 'QmdCrquDwd7RfZ6GCZFEVADwe8uyyw1YmF9mtAB7etDgmK/b/g',
      content: 'ice'
    }, {
      path: 'QmdCrquDwd7RfZ6GCZFEVADwe8uyyw1YmF9mtAB7etDgmK/b/c/d/f',
      content: 'strawberry'
    }, {
      path: 'QmdCrquDwd7RfZ6GCZFEVADwe8uyyw1YmF9mtAB7etDgmK/b/c/d/e',
      content: 'banana'
    }])
  })
})

async function recursiveExport (node: UnixFSEntry, path: string, entries: Array<{ path: string, content: string }> = []): Promise<Array<{ path: string, content: string }>> {
  if (node.type !== 'directory') {
    throw new Error('Can only recursively export directories')
  }

  for await (const entry of node.content()) {
    if (entry.type === 'directory') {
      await recursiveExport(entry, `${path}/${entry.name}`, entries)
    } else if (entry.type === 'file') {
      entries.push({
        path: `${path}/${entry.name}`,
        content: uint8ArrayToString(uint8ArrayConcat(await all(entry.content())))
      })
    }
  }

  return entries
}

function normalizeNode (node: { path?: string, cid: CID }): { path: string, multihash: string } {
  return {
    path: node.path ?? '',
    multihash: node.cid.toString()
  }
}

function byPath (a: { path: string }, b: { path: string }): number {
  if (a.path > b.path) { return -1 }
  if (a.path < b.path) { return 1 }
  return 0
}
