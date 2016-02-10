/* globals describe, it */

const expect = require('chai').expect

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

  it.skip('file add blocksize', (done) => {})
  it.skip('file add and remove blocksize', (done) => {})
  it.skip('metadata', (done) => {})
  it.skip('symlink', (done) => {})
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
    it.skip('raw', (done) => {})
    it.skip('directory', (done) => {})
    it.skip('file', (done) => {})
    it.skip('metadata', (done) => {})
    it.skip('symlink', (done) => {})
  })
})
