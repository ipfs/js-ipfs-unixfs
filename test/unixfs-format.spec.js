/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const loadFixture = require('aegir/fixtures')

const UnixFS = require('../src')

const raw = loadFixture(__dirname, 'fixtures/raw.unixfs')
const directory = loadFixture(__dirname, 'fixtures/directory.unixfs')
const file = loadFixture(__dirname, 'fixtures/file.txt.unixfs')
const symlink = loadFixture(__dirname, 'fixtures/symlink.txt.unixfs')

describe('unixfs-format', () => {
  it('raw', (done) => {
    const data = new UnixFS('raw', new Buffer('bananas'))
    const marsheled = data.marshal()
    const unmarsheled = UnixFS.unmarshal(marsheled)
    expect(data.type).to.equal(unmarsheled.type)
    expect(data.data).to.deep.equal(unmarsheled.data)
    expect(data.blockSizes).to.deep.equal(unmarsheled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarsheled.fileSize())
    done()
  })

  it('directory', (done) => {
    const data = new UnixFS('directory')
    const marsheled = data.marshal()
    const unmarsheled = UnixFS.unmarshal(marsheled)
    expect(data.type).to.equal(unmarsheled.type)
    expect(data.data).to.deep.equal(unmarsheled.data)
    expect(data.blockSizes).to.deep.equal(unmarsheled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarsheled.fileSize())
    done()
  })

  it('file', (done) => {
    const data = new UnixFS('file', new Buffer('batata'))
    const marsheled = data.marshal()
    const unmarsheled = UnixFS.unmarshal(marsheled)
    expect(data.type).to.equal(unmarsheled.type)
    expect(data.data).to.deep.equal(unmarsheled.data)
    expect(data.blockSizes).to.deep.equal(unmarsheled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarsheled.fileSize())
    done()
  })

  it('file add blocksize', (done) => {
    const data = new UnixFS('file')
    data.addBlockSize(256)
    const marsheled = data.marshal()
    const unmarsheled = UnixFS.unmarshal(marsheled)
    expect(data.type).to.equal(unmarsheled.type)
    expect(data.data).to.deep.equal(unmarsheled.data)
    expect(data.blockSizes).to.deep.equal(unmarsheled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarsheled.fileSize())
    done()
  })

  it('file add and remove blocksize', (done) => {
    const data = new UnixFS('file')
    data.addBlockSize(256)
    const marsheled = data.marshal()
    const unmarsheled = UnixFS.unmarshal(marsheled)
    expect(data.type).to.equal(unmarsheled.type)
    expect(data.data).to.deep.equal(unmarsheled.data)
    expect(data.blockSizes).to.deep.equal(unmarsheled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarsheled.fileSize())
    unmarsheled.removeBlockSize(0)
    expect(data.blockSizes).to.not.deep.equal(unmarsheled.blockSizes)
    done()
  })

  // figuring out what is this metadata for https://github.com/ipfs/js-ipfs-data-importing/issues/3#issuecomment-182336526
  it.skip('metadata', (done) => {})

  it('symlink', (done) => {
    const data = new UnixFS('symlink')
    const marsheled = data.marshal()
    const unmarsheled = UnixFS.unmarshal(marsheled)
    expect(data.type).to.equal(unmarsheled.type)
    expect(data.data).to.deep.equal(unmarsheled.data)
    expect(data.blockSizes).to.deep.equal(unmarsheled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarsheled.fileSize())
    done()
  })
  it('wrong type', (done) => {
    let data
    try {
      data = new UnixFS('bananas')
    } catch (err) {
      expect(err).to.exist
      expect(data).to.not.exist
      done()
    }
  })

  describe('interop', () => {
    it('raw', (done) => {
      const unmarsheled = UnixFS.unmarshal(raw)
      expect(unmarsheled.data).to.deep.equal(new Buffer('Hello UnixFS\n'))
      expect(unmarsheled.type).to.equal('file')
      expect(unmarsheled.marshal()).to.deep.equal(raw)
      done()
    })

    it('directory', (done) => {
      const unmarsheled = UnixFS.unmarshal(directory)
      expect(unmarsheled.data).to.deep.equal(undefined)
      expect(unmarsheled.type).to.equal('directory')
      expect(unmarsheled.marshal()).to.deep.equal(directory)
      done()
    })

    it('file', (done) => {
      const unmarsheled = UnixFS.unmarshal(file)
      expect(unmarsheled.data).to.deep.equal(new Buffer('Hello UnixFS\n'))
      expect(unmarsheled.type).to.equal('file')
      expect(unmarsheled.marshal()).to.deep.equal(file)
      done()
    })

    it.skip('metadata', (done) => {
    })

    it('symlink', (done) => {
      const unmarsheled = UnixFS.unmarshal(symlink)
      expect(unmarsheled.data).to.deep.equal(new Buffer('file.txt'))
      expect(unmarsheled.type).to.equal('symlink')
      // TODO: waiting on https://github.com/ipfs/js-ipfs-data-importing/issues/3#issuecomment-182440079
      // expect(unmarsheled.marshal()).to.deep.equal(symlink)
      done()
    })
  })
})
