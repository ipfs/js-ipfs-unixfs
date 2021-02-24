/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')
const { importer } = require('ipfs-unixfs-importer')
const all = require('it-all')
const last = require('it-last')
const blockApi = require('./helpers/block')
const randomBytes = require('it-buffer-stream')
const uint8ArrayConcat = require('uint8arrays/concat')
const asAsyncIterable = require('./helpers/as-async-iterable')

const ONE_MEG = Math.pow(1024, 2)

const { exporter, walkPath } = require('./../src')

describe('exporter subtree', () => {
  /** @type {import('ipfs-unixfs-importer/src/types').BlockAPI} */
  const block = blockApi()

  it('exports a file 2 levels down', async () => {
    const content = uint8ArrayConcat(await all(randomBytes(ONE_MEG)))

    const imported = await last(importer([{
      path: './200Bytes.txt',
      content: randomBytes(ONE_MEG)
    }, {
      path: './level-1/200Bytes.txt',
      content: asAsyncIterable(content)
    }], block))

    if (!imported) {
      throw new Error('Nothing imported')
    }

    const exported = await exporter(`${imported.cid}/level-1/200Bytes.txt`, block)

    expect(exported).to.have.property('cid')
    expect(exported.name).to.equal('200Bytes.txt')
    expect(exported.path).to.equal(`${imported.cid}/level-1/200Bytes.txt`)

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

    if (!imported) {
      throw new Error('Nothing imported')
    }

    const exported = await exporter(`${imported.cid}/level-1`, block)

    if (exported.type !== 'directory') {
      throw new Error('Unexpected type')
    }

    const files = await all(exported.content())

    expect(files.length).to.equal(2)
    expect(files[0].name).to.equal('200Bytes.txt')
    expect(files[0].path).to.equal(`${imported.cid}/level-1/200Bytes.txt`)

    expect(files[1].name).to.equal('level-2')
    expect(files[1].path).to.equal(`${imported.cid}/level-1/level-2`)

    if (files[0].type !== 'file') {
      throw new Error('Unexpected type')
    }

    const data = uint8ArrayConcat(await all(files[0].content()))
    expect(data).to.deep.equal(content)
  })

  it('exports a non existing file from a directory', async () => {
    const imported = await last(importer([{
      path: '/derp/200Bytes.txt',
      content: randomBytes(ONE_MEG)
    }], block))

    if (!imported) {
      throw new Error('Nothing imported')
    }

    try {
      await exporter(`${imported.cid}/doesnotexist`, block)
    } catch (err) {
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

    if (!imported) {
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
