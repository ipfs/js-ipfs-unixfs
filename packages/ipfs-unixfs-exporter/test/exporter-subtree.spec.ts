/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import { importer } from 'ipfs-unixfs-importer'
import all from 'it-all'
import randomBytes from 'it-buffer-stream'
import drain from 'it-drain'
import last from 'it-last'
import toBuffer from 'it-to-buffer'
import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import { exporter, walkPath } from './../src/index.js'
import asAsyncIterable from './helpers/as-async-iterable.js'

const ONE_KB = 1_024
const ONE_MEG = Math.pow(1024, 2)

describe('exporter subtree', () => {
  const block = new MemoryBlockstore()

  it('exports a file 2 levels down', async () => {
    const content = uint8ArrayConcat(await all(randomBytes(ONE_MEG)))

    const imported = await last(importer([{
      path: './200Bytes.txt',
      content: randomBytes(ONE_MEG)
    }, {
      path: './level-1/200Bytes.txt',
      content: asAsyncIterable(content)
    }], block, {
      rawLeaves: false,
      cidVersion: 0
    }))

    if (imported == null) {
      throw new Error('Nothing imported')
    }

    const entry = await last(walkPath(`${imported.cid}/level-1/200Bytes.txt`, block))

    if (entry == null) {
      throw new Error('Did not walk path')
    }

    expect(entry).to.have.property('cid')
    expect(entry).to.have.property('name', '200Bytes.txt')
    expect(entry).to.have.property('path', `${imported.cid}/level-1/200Bytes.txt`)

    const exported = await exporter(entry.cid, block)

    if (exported.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(exported.content()))
    expect(data).to.deep.equal(content)
  })

  it('exports a small file 2 levels down', async () => {
    const content = uint8ArrayConcat(await all(randomBytes(ONE_KB)))

    const imported = await last(importer([{
      path: './200Bytes.txt',
      content: randomBytes(ONE_KB)
    }, {
      path: './level-1/200Bytes.txt',
      content: asAsyncIterable(content)
    }], block, {
      rawLeaves: false,
      cidVersion: 0
    }))

    if (imported == null) {
      throw new Error('Nothing imported')
    }

    const entry = await last(walkPath(`${imported.cid}/level-1/200Bytes.txt`, block))

    if (entry == null) {
      throw new Error('Did not walk path')
    }

    expect(entry).to.have.property('cid')
    expect(entry).to.have.property('name', '200Bytes.txt')
    expect(entry).to.have.property('path', `${imported.cid}/level-1/200Bytes.txt`)

    const exported = await exporter(entry.cid, block)

    if (exported.type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(exported.content()))
    expect(data).to.deep.equal(content)
  })

  it('exports a directory 1 level down', async () => {
    const content = uint8ArrayConcat(await all(randomBytes(ONE_MEG)))
    const imported = await last(importer([{
      path: './200Bytes.txt',
      content: randomBytes(ONE_MEG)
    }, {
      path: './level-1/200Bytes.txt',
      content: asAsyncIterable(content)
    }, {
      path: './level-1/level-2'
    }], block))

    if (imported == null) {
      throw new Error('Nothing imported')
    }

    const entry = await last(walkPath(`${imported.cid}/level-1`, block))

    if (entry == null) {
      throw new Error('Did not walk path')
    }

    const exported = await exporter(entry.cid, block)

    if (exported.type !== 'directory') {
      throw new Error('Unexpected type')
    }

    const files = await all(exported.entries())
    expect(files.length).to.equal(2)
    expect(files[0].name).to.equal('200Bytes.txt')
    expect(files[1].name).to.equal('level-2')

    const file = await exporter(files[0].cid, block)

    if (file.type !== 'file') {
      throw new Error('Expected file')
    }

    const data = await toBuffer(file.content())
    expect(data).to.equalBytes(content)
  })

  it('exports a non existing file from a directory', async () => {
    const imported = await last(importer([{
      path: '/derp/200Bytes.txt',
      content: randomBytes(ONE_MEG)
    }], block))

    if (imported == null) {
      throw new Error('Nothing imported')
    }

    try {
      await drain(walkPath(`${imported.cid}/doesnotexist`, block))
    } catch (err: any) {
      expect(err.code).to.equal('ERR_NOT_FOUND')
    }
  })

  it('uses .path to export all components of a path', async () => {
    const content = uint8ArrayConcat(await all(randomBytes(ONE_MEG)))

    const imported = await last(importer([{
      path: './200Bytes.txt',
      content: randomBytes(ONE_MEG)
    }, {
      path: './level-1/200Bytes.txt',
      content: asAsyncIterable(content)
    }, {
      path: './level-1/level-2'
    }, {
      path: './level-1/level-2/200Bytes.txt',
      content: asAsyncIterable(content)
    }], block))

    if (imported == null) {
      throw new Error('Nothing imported')
    }

    const exported = await all(walkPath(`${imported.cid}/level-1/level-2/200Bytes.txt`, block))

    expect(exported.length).to.equal(4)
    expect(exported[0].path).to.equal(imported.cid.toString())
    expect(exported[0].name).to.equal(imported.cid.toString())
    expect(exported[1].path).to.equal(`${imported.cid}/level-1`)
    expect(exported[1].name).to.equal('level-1')
    expect(exported[2].path).to.equal(`${imported.cid}/level-1/level-2`)
    expect(exported[2].name).to.equal('level-2')
    expect(exported[3].path).to.equal(`${imported.cid}/level-1/level-2/200Bytes.txt`)
    expect(exported[3].name).to.equal('200Bytes.txt')
  })
})
