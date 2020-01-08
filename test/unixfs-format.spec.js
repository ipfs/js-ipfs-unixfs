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
const { Buffer } = require('buffer')
const protons = require('protons')
const unixfsData = protons(require('../src/unixfs.proto')).Data

describe('unixfs-format', () => {
  it('old style constructor', () => {
    const buf = Buffer.from('hello world')
    const entry = new UnixFS('file', buf)

    expect(entry.type).to.equal('file')
    expect(entry.data).to.deep.equal(buf)
  })

  it('old style constructor with single argument', () => {
    const entry = new UnixFS('file')

    expect(entry.type).to.equal('file')
  })

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

  it('default mode for files', () => {
    const data = new UnixFS({
      type: 'file'
    })

    expect(UnixFS.unmarshal(data.marshal())).to.have.property('mode', parseInt('0644', 8))
  })

  it('default mode for directories', () => {
    const data = new UnixFS({
      type: 'directory'
    })

    expect(UnixFS.unmarshal(data.marshal())).to.have.property('mode', parseInt('0755', 8))
  })

  it('default mode for hamt shards', () => {
    const data = new UnixFS({
      type: 'hamt-sharded-directory'
    })

    expect(UnixFS.unmarshal(data.marshal())).to.have.property('mode', parseInt('0755', 8))
  })

  it('sets mode to 0', () => {
    const mode = 0
    const data = new UnixFS({
      type: 'file'
    })
    data.mode = mode

    expect(UnixFS.unmarshal(data.marshal())).to.have.property('mode', mode)
  })

  it('mode as string', () => {
    const data = new UnixFS({
      type: 'file',
      mode: '0555'
    })

    expect(UnixFS.unmarshal(data.marshal())).to.have.property('mode', parseInt('0555', 8))
  })

  it('mode as string set outside constructor', () => {
    const data = new UnixFS({
      type: 'file'
    })
    data.mode = '0555'

    expect(UnixFS.unmarshal(data.marshal())).to.have.property('mode', parseInt('0555', 8))
  })

  it('mtime', () => {
    const mtime = {
      secs: 5,
      nsecs: 0
    }
    const data = new UnixFS({
      type: 'file',
      mtime
    })

    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.have.deep.property('mtime', mtime)
  })

  it('default mtime', () => {
    const data = new UnixFS({
      type: 'file'
    })

    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.not.have.property('mtime')
  })

  it('mtime as date', () => {
    const mtime = {
      secs: 5,
      nsecs: 0
    }
    const data = new UnixFS({
      type: 'file',
      mtime: new Date(5000)
    })

    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.have.deep.property('mtime', mtime)
  })

  it('mtime as hrtime', () => {
    const mtime = {
      secs: 5,
      nsecs: 0
    }
    const data = new UnixFS({
      type: 'file',
      mtime: [5, 0]
    })

    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.have.deep.property('mtime', mtime)
  })
  /*
  TODO: https://github.com/ipfs/aegir/issues/487

  it('mtime as bigint', () => {
    const mtime = {
      secs: 5,
      nsecs: 0
    }
    const data = new UnixFS({
      type: 'file',
      mtime: BigInt(5 * 1e9)
    })

    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.have.deep.property('mtime', mtime)
  })
  */
  it('sets mtime to 0', () => {
    const mtime = {
      secs: 0,
      nsecs: 0
    }
    const data = new UnixFS({
      type: 'file',
      mtime
    })

    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.have.deep.property('mtime', mtime)
  })

  it('mtime as date set outside constructor', () => {
    const mtime = {
      secs: 5,
      nsecs: 0
    }
    const data = new UnixFS({
      type: 'file'
    })
    data.mtime = new Date(5000)

    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.have.deep.property('mtime', mtime)
  })

  it('ignores invalid mtime', () => {
    const data = new UnixFS({
      type: 'file',
      mtime: 'what is this'
    })

    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.not.have.property('mtime')
  })

  it('ignores invalid mtime set outside of constructor', () => {
    const entry = new UnixFS({
      type: 'file'
    })
    entry.mtime = 'what is this'

    const marshaled = entry.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.not.have.property('mtime')
  })

  it('survives null mtime', () => {
    const entry = new UnixFS({
      type: 'file'
    })
    entry.mtime = null

    const marshaled = entry.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.not.have.property('mtime')
  })

  it('does not overwrite unknown mode bits', () => {
    const mode = 0xFFFFFFF // larger than currently defined mode bits
    const buf = unixfsData.encode({
      Type: 0,
      mode
    })

    const unmarshaled = UnixFS.unmarshal(buf)
    const marshaled = unmarshaled.marshal()

    const entry = unixfsData.decode(marshaled)
    expect(entry).to.have.property('mode', mode)
  })

  // figuring out what is this metadata for https://github.com/ipfs/js-ipfs-data-importing/issues/3#issuecomment-182336526
  it('metadata', () => {
    const entry = new UnixFS({
      type: 'metadata'
    })

    const marshaled = entry.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)

    expect(unmarshaled).to.have.property('type', 'metadata')
  })

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

  it('invalid type', (done) => {
    try {
      // eslint-disable-next-line no-new
      new UnixFS({
        type: 'bananas'
      })
    } catch (err) {
      expect(err).to.have.property('code', 'ERR_INVALID_TYPE')
      done()
    }
  })

  it('invalid type with old style constructor', (done) => {
    try {
      // eslint-disable-next-line no-new
      new UnixFS('bananas')
    } catch (err) {
      expect(err).to.have.property('code', 'ERR_INVALID_TYPE')
      done()
    }
  })

  it('invalid type set outside constructor', (done) => {
    const entry = new UnixFS()
    entry.type = 'bananas'

    try {
      entry.marshal()
    } catch (err) {
      expect(err).to.have.property('code', 'ERR_INVALID_TYPE')
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
