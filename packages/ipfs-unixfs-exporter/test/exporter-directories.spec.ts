import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import { importer } from 'ipfs-unixfs-importer'
import all from 'it-all'
import last from 'it-last'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { exporter } from '../src/index.ts'
import type { Blockstore } from 'interface-blockstore'
import type { CID } from 'multiformats/cid'

describe('export - directories', () => {
  let block: Blockstore

  beforeEach(() => {
    block = new MemoryBlockstore()
  })

  async function createDirectory (files: number): Promise<CID> {
    const result = await last(importer([{
      path: '/file1.txt',
      content: uint8ArrayFromString('file 1')
    }, {
      path: '/file2.txt',
      content: uint8ArrayFromString('file 2')
    }, {
      path: '/file3.txt',
      content: uint8ArrayFromString('file 3')
    }, {
      path: '/file4.txt',
      content: uint8ArrayFromString('file 4')
    }, {
      path: '/file5.txt',
      content: uint8ArrayFromString('file 5')
    }], block, {
      wrapWithDirectory: true
    }))

    if (result == null) {
      throw new Error('Import failed')
    }

    return result.cid
  }

  it('should limit directory entries', async () => {
    const cid = await createDirectory(5)
    const dir = await exporter(cid, block)

    if (dir.type !== 'directory') {
      throw new Error(`Unexpected type '${dir.type}'`)
    }

    const files = await all(dir.entries({
      offset: 2,
      length: 1
    }))

    expect(files).to.have.lengthOf(1)
    expect(files).to.have.nested.property('[0].path', `${cid}/file3.txt`)
  })
})
