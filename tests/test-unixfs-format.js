/* globals describe, it */

const expect = require('chai').expect
const fs = require('fs')

const UnixfsFormat = require('../src').format

describe('unixfs-format', () => {
  it('raw', (done) => {
    const data = new UnixfsFormat('raw', new Buffer('bananas'))
    const marsheled = data.marshal()
    const unmarsheled = UnixfsFormat.unmarshal(marsheled)
    expect(data.type).to.equal(unmarsheled.type)
    expect(data.data).to.deep.equal(unmarsheled.data)
    expect(data.blockSizes).to.deep.equal(unmarsheled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarsheled.fileSize())
    done()
  })

  it('directory', (done) => {
    const data = new UnixfsFormat('directory')
    const marsheled = data.marshal()
    const unmarsheled = UnixfsFormat.unmarshal(marsheled)
    expect(data.type).to.equal(unmarsheled.type)
    expect(data.data).to.deep.equal(unmarsheled.data)
    expect(data.blockSizes).to.deep.equal(unmarsheled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarsheled.fileSize())
    done()
  })

  it('file', (done) => {
    const data = new UnixfsFormat('file', new Buffer('batata'))
    const marsheled = data.marshal()
    const unmarsheled = UnixfsFormat.unmarshal(marsheled)
    expect(data.type).to.equal(unmarsheled.type)
    expect(data.data).to.deep.equal(unmarsheled.data)
    expect(data.blockSizes).to.deep.equal(unmarsheled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarsheled.fileSize())
    done()
  })

  it('file add blocksize', (done) => {
    const data = new UnixfsFormat('file')
    data.addBlockSize(256)
    const marsheled = data.marshal()
    const unmarsheled = UnixfsFormat.unmarshal(marsheled)
    expect(data.type).to.equal(unmarsheled.type)
    expect(data.data).to.deep.equal(unmarsheled.data)
    expect(data.blockSizes).to.deep.equal(unmarsheled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarsheled.fileSize())
    done()
  })

  it('file add and remove blocksize', (done) => {
    const data = new UnixfsFormat('file')
    data.addBlockSize(256)
    const marsheled = data.marshal()
    const unmarsheled = UnixfsFormat.unmarshal(marsheled)
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
    const data = new UnixfsFormat('symlink')
    const marsheled = data.marshal()
    const unmarsheled = UnixfsFormat.unmarshal(marsheled)
    expect(data.type).to.equal(unmarsheled.type)
    expect(data.data).to.deep.equal(unmarsheled.data)
    expect(data.blockSizes).to.deep.equal(unmarsheled.blockSizes)
    expect(data.fileSize()).to.deep.equal(unmarsheled.fileSize())
    done()
  })
  it('wrong type', (done) => {
    var data
    try {
      data = new UnixfsFormat('bananas')
    } catch (err) {
      expect(err).to.exist
      expect(data).to.not.exist
      done()
    }
  })

  describe('interop', () => {
    it('raw', (done) => {
      var raw = fs.readFileSync(__dirname + '/test-data/raw.unixfs')
      const unmarsheled = UnixfsFormat.unmarshal(raw)
      expect(unmarsheled.data).to.deep.equal(new Buffer('Hello UnixFS\n'))
      expect(unmarsheled.type).to.equal('file')
      expect(unmarsheled.marshal()).to.deep.equal(raw)
      done()
    })

    it('directory', (done) => {
      var raw = fs.readFileSync(__dirname + '/test-data/directory.unixfs')
      const unmarsheled = UnixfsFormat.unmarshal(raw)
      expect(unmarsheled.data).to.deep.equal(undefined)
      expect(unmarsheled.type).to.equal('directory')
      expect(unmarsheled.marshal()).to.deep.equal(raw)
      done()
    })

    it('file', (done) => {
      var raw = fs.readFileSync(__dirname + '/test-data/file.txt.unixfs')
      const unmarsheled = UnixfsFormat.unmarshal(raw)
      expect(unmarsheled.data).to.deep.equal(new Buffer('Hello UnixFS\n'))
      expect(unmarsheled.type).to.equal('file')
      expect(unmarsheled.marshal()).to.deep.equal(raw)
      done()
    })

    it.skip('metadata', (done) => {
    })

    it('symlink', (done) => {
      var raw = fs.readFileSync(__dirname + '/test-data/symlink.txt.unixfs')
      const unmarsheled = UnixfsFormat.unmarshal(raw)
      expect(unmarsheled.data).to.deep.equal(new Buffer('file.txt'))
      expect(unmarsheled.type).to.equal('symlink')
      // TODO: waiting on https://github.com/ipfs/js-ipfs-data-importing/issues/3#issuecomment-182440079
      // expect(unmarsheled.marshal()).to.deep.equal(raw)
      done()
    })
  })
})
