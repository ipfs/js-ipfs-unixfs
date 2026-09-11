import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import { importer } from 'ipfs-unixfs-importer'
import all from 'it-all'
import last from 'it-last'
import toBuffer from 'it-to-buffer'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { exporter } from '../src/index.ts'
import type { Blockstore } from 'interface-blockstore'
import type { ImporterOptions } from 'ipfs-unixfs-importer'
import type { CID } from 'multiformats/cid'

describe('export - directories', () => {
  let block: Blockstore

  beforeEach(() => {
    block = new MemoryBlockstore()
  })

  async function createDirectory (files: number, options?: ImporterOptions): Promise<CID> {
    const result = await last(importer(
      new Array(files).fill(0).map((_, i) => ({
        path: `/file${i}.txt`,
        content: uint8ArrayFromString(`file ${i}`)
      })), block, {
        wrapWithDirectory: true,
        ...options
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
    expect(files).to.have.nested.property('[0].path', `${cid}/file2.txt`)
  })

  it('should export a file', async () => {
    const cid = await createDirectory(1, {
      rawLeaves: false
    })
    const file = await exporter(`/ipfs/${cid}/file0.txt`, block)

    if (file.type !== 'file') {
      throw new Error(`Unexpected type '${file.type}'`)
    }

    const content = await toBuffer(file.content())
    expect(content).to.equalBytes(uint8ArrayFromString('file 0'))
  })
})
