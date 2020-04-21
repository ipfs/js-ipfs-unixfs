/* eslint-env mocha */
'use strict'

const { Buffer } = require('buffer')
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const importer = require('ipfs-unixfs-importer')
const mc = require('multicodec')
const all = require('it-all')
const last = require('it-last')
const blockApi = require('./helpers/block')
const randomBytes = require('it-buffer-stream')

const ONE_MEG = Math.pow(1024, 2)

const exporter = require('./../src')

describe('exporter subtree', () => {
  let ipld
  let block

  before(async () => {
    ipld = await inMemory(IPLD)
    block = blockApi(ipld)
  })

  it('exports a file 2 levels down', async () => {
    const content = Buffer.concat(await all(randomBytes(ONE_MEG)))

    const imported = await last(importer([{
      path: './200Bytes.txt',
      content: randomBytes(ONE_MEG)
    }, {
      path: './level-1/200Bytes.txt',
      content
    }], block))

    const exported = await exporter(`${imported.cid.toBaseEncodedString()}/level-1/200Bytes.txt`, ipld)

    expect(exported).to.have.property('cid')
    expect(exported.name).to.equal('200Bytes.txt')
    expect(exported.path).to.equal(`${imported.cid.toBaseEncodedString()}/level-1/200Bytes.txt`)

    const data = Buffer.concat(await all(exported.content()))
    expect(data).to.deep.equal(content)
  })

  it('exports a directory 1 level down', async () => {
    const content = Buffer.concat(await all(randomBytes(ONE_MEG)))
    const imported = await last(importer([{
      path: './200Bytes.txt',
      content: randomBytes(ONE_MEG)
    }, {
      path: './level-1/200Bytes.txt',
      content
    }, {
      path: './level-1/level-2'
    }], block))

    const exported = await exporter(`${imported.cid.toBaseEncodedString()}/level-1`, ipld)
    const files = await all(exported.content())

    expect(files.length).to.equal(2)
    expect(files[0].name).to.equal('200Bytes.txt')
    expect(files[0].path).to.equal(`${imported.cid.toBaseEncodedString()}/level-1/200Bytes.txt`)

    expect(files[1].name).to.equal('level-2')
    expect(files[1].path).to.equal(`${imported.cid.toBaseEncodedString()}/level-1/level-2`)

    const data = Buffer.concat(await all(files[0].content()))
    expect(data).to.deep.equal(content)
  })

  it('exports a non existing file from a directory', async () => {
    const imported = await last(importer([{
      path: '/derp/200Bytes.txt',
      content: randomBytes(ONE_MEG)
    }], block))

    try {
      await exporter(`${imported.cid.toBaseEncodedString()}/doesnotexist`, ipld)
    } catch (err) {
      expect(err.code).to.equal('ERR_NOT_FOUND')
    }
  })

  it('exports starting from non-protobuf node', async () => {
    const content = Buffer.concat(await all(randomBytes(ONE_MEG)))

    const imported = await last(importer([{
      path: './level-1/200Bytes.txt',
      content
    }], block, {
      wrapWithDirectory: true
    }))

    const cborNodeCid = await ipld.put({
      a: {
        file: imported.cid
      }
    }, mc.DAG_CBOR)

    const exported = await exporter(`${cborNodeCid.toBaseEncodedString()}/a/file/level-1/200Bytes.txt`, ipld)

    expect(exported.name).to.equal('200Bytes.txt')
    expect(exported.path).to.equal(`${cborNodeCid.toBaseEncodedString()}/a/file/level-1/200Bytes.txt`)

    const data = Buffer.concat(await all(exported.content()))
    expect(data).to.deep.equal(content)
  })

  it('uses .path to export all components of a path', async () => {
    const content = Buffer.concat(await all(randomBytes(ONE_MEG)))

    const imported = await last(importer([{
      path: './200Bytes.txt',
      content: randomBytes(ONE_MEG)
    }, {
      path: './level-1/200Bytes.txt',
      content
    }, {
      path: './level-1/level-2'
    }, {
      path: './level-1/level-2/200Bytes.txt',
      content
    }], block))

    const exported = await all(exporter.path(`${imported.cid.toBaseEncodedString()}/level-1/level-2/200Bytes.txt`, ipld))

    expect(exported.length).to.equal(4)
    expect(exported[0].path).to.equal(imported.cid.toBaseEncodedString())
    expect(exported[0].name).to.equal(imported.cid.toBaseEncodedString())
    expect(exported[1].path).to.equal(`${imported.cid.toBaseEncodedString()}/level-1`)
    expect(exported[1].name).to.equal('level-1')
    expect(exported[2].path).to.equal(`${imported.cid.toBaseEncodedString()}/level-1/level-2`)
    expect(exported[2].name).to.equal('level-2')
    expect(exported[3].path).to.equal(`${imported.cid.toBaseEncodedString()}/level-1/level-2/200Bytes.txt`)
    expect(exported[3].name).to.equal('200Bytes.txt')
  })
})
