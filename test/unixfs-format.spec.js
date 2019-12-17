/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const loadFixture = require('aegir/fixtures')

const UnixFS = require('../src')

const raw = loadFixture('test/fixtures/raw.unixfs')
const directory = loadFixture('test/fixtures/directory.unixfs')
const file = loadFixture('test/fixtures/file.txt.unixfs')
const symlink = loadFixture('test/fixtures/symlink.txt.unixfs')
const Buffer = require('safe-buffer').Buffer

describe('unixfs-format', () => {
  it('defaults to file', () => {
    const data = new UnixFS()
    expect(data.type).to.equal('file')
    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(data.type).to.equal(unmarshaled.type)
    expect(data.data).to.deep.equal(unmarshaled.data)
    expect(data.blockSizes).to.deep.equal(unmarshaled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarshaled.fileSize())
  })

  it('raw', () => {
    const data = new UnixFS({
      type: 'raw',
      data: Buffer.from('bananas')
    })
    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(data.type).to.equal(unmarshaled.type)
    expect(data.data).to.deep.equal(unmarshaled.data)
    expect(data.blockSizes).to.deep.equal(unmarshaled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarshaled.fileSize())
  })

  it('directory', () => {
    const data = new UnixFS({
      type: 'directory'
    })
    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(data.type).to.equal(unmarshaled.type)
    expect(data.data).to.deep.equal(unmarshaled.data)
    expect(data.blockSizes).to.deep.equal(unmarshaled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarshaled.fileSize())
  })

  it('hamt-sharded-directory', () => {
    const data = new UnixFS({
      type: 'hamt-sharded-directory'
    })
    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(data.type).to.equal(unmarshaled.type)
    expect(data.data).to.deep.equal(unmarshaled.data)
    expect(data.blockSizes).to.deep.equal(unmarshaled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarshaled.fileSize())
  })

  it('file', () => {
    const data = new UnixFS({
      type: 'file',
      data: Buffer.from('batata')
    })
    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(data.type).to.equal(unmarshaled.type)
    expect(data.data).to.deep.equal(unmarshaled.data)
    expect(data.blockSizes).to.deep.equal(unmarshaled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarshaled.fileSize())
  })

  it('file add blocksize', () => {
    const data = new UnixFS({
      type: 'file'
    })
    data.addBlockSize(256)
    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(data.type).to.equal(unmarshaled.type)
    expect(data.data).to.deep.equal(unmarshaled.data)
    expect(data.blockSizes).to.deep.equal(unmarshaled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarshaled.fileSize())
  })

  it('file add and remove blocksize', () => {
    const data = new UnixFS({
      type: 'file'
    })
    data.addBlockSize(256)
    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(data.type).to.equal(unmarshaled.type)
    expect(data.data).to.deep.equal(unmarshaled.data)
    expect(data.blockSizes).to.deep.equal(unmarshaled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarshaled.fileSize())
    unmarshaled.removeBlockSize(0)
    expect(data.blockSizes).to.not.deep.equal(unmarshaled.blockSizes)
  })

  it('mode', () => {
    const mode = parseInt('0555', 8)
    const data = new UnixFS({
      type: 'file'
    })
    data.mode = mode

    expect(UnixFS.unmarshal(data.marshal())).to.have.property('mode', mode)
  })

  it('sets mode to 0', () => {
    const mode = 0
    const data = new UnixFS({
      type: 'file'
    })
    data.mode = mode

    expect(UnixFS.unmarshal(data.marshal())).to.have.property('mode', mode)
  })

  it('mtime', () => {
    const mtime = new Date()
    const data = new UnixFS({
      type: 'file',
      mtime
    })

    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled.mtime).to.deep.equal(new Date(Math.round(mtime.getTime() / 1000) * 1000))
  })

  it('sets mtime to 0', () => {
    const mtime = new Date(0)
    const data = new UnixFS({
      type: 'file',
      mtime
    })
    expect(UnixFS.unmarshal(data.marshal())).to.have.deep.property('mtime', new Date(Math.round(mtime.getTime() / 1000) * 1000))
  })

  // figuring out what is this metadata for https://github.com/ipfs/js-ipfs-data-importing/issues/3#issuecomment-182336526
  it.skip('metadata', () => {})

  it('symlink', () => {
    const data = new UnixFS({
      type: 'symlink'
    })
    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(data.type).to.equal(unmarshaled.type)
    expect(data.data).to.deep.equal(unmarshaled.data)
    expect(data.blockSizes).to.deep.equal(unmarshaled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarshaled.fileSize())
  })
  it('wrong type', (done) => {
    let data
    try {
      data = new UnixFS({
        type: 'bananas'
      })
    } catch (err) {
      expect(err).to.exist()
      expect(data).to.not.exist()
      done()
    }
  })

  describe('interop', () => {
    it('raw', () => {
      const unmarshaled = UnixFS.unmarshal(raw)
      expect(unmarshaled.data).to.eql(Buffer.from('Hello UnixFS\n'))
      expect(unmarshaled.type).to.equal('file')
      expect(unmarshaled.marshal()).to.deep.equal(raw)
    })

    it('directory', () => {
      const unmarshaled = UnixFS.unmarshal(directory)
      expect(unmarshaled.data).to.deep.equal(undefined)
      expect(unmarshaled.type).to.equal('directory')
      expect(unmarshaled.marshal()).to.deep.equal(directory)
    })

    it('file', () => {
      const unmarshaled = UnixFS.unmarshal(file)
      expect(unmarshaled.data).to.deep.equal(Buffer.from('Hello UnixFS\n'))
      expect(unmarshaled.type).to.equal('file')
      expect(unmarshaled.marshal()).to.deep.equal(file)
    })

    it.skip('metadata', () => {
    })

    it('symlink', () => {
      const unmarshaled = UnixFS.unmarshal(symlink)
      expect(unmarshaled.data).to.deep.equal(Buffer.from('file.txt'))
      expect(unmarshaled.type).to.equal('symlink')
      // TODO: waiting on https://github.com/ipfs/js-ipfs-data-importing/issues/3#issuecomment-182440079
      // expect(unmarshaled.marshal()).to.deep.equal(symlink)
    })
  })

  it('empty', () => {
    const data = new UnixFS({
      type: 'file'
    })
    const marshaled = data.marshal()

    expect(marshaled).to.deep.equal(Buffer.from([0x08, 0x02, 0x18, 0x00]))
  })
})
