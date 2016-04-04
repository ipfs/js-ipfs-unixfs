/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const fs = require('fs')
const path = require('path')

const UnixFS = require('../src')

describe('IPFS-UnixFS Tests on NodeJS', () => {
  
  describe('interop', () => {
    it('raw', (done) => {
      const raw = fs.readFileSync(path.join(__dirname, '../test-data/raw.unixfs'))
      const unmarsheled = UnixFS.unmarshal(raw)
      expect(unmarsheled.data).to.deep.equal(new Buffer('Hello UnixFS\n'))
      expect(unmarsheled.type).to.equal('file')
      expect(unmarsheled.marshal()).to.deep.equal(raw)
      done()
    })

    it('directory', (done) => {
      const raw = fs.readFileSync(path.join(__dirname, '../test-data/directory.unixfs'))
      const unmarsheled = UnixFS.unmarshal(raw)
      expect(unmarsheled.data).to.deep.equal(undefined)
      expect(unmarsheled.type).to.equal('directory')
      expect(unmarsheled.marshal()).to.deep.equal(raw)
      done()
    })

    it('file', (done) => {
      const raw = fs.readFileSync(path.join(__dirname, '../test-data/file.txt.unixfs'))
      const unmarsheled = UnixFS.unmarshal(raw)
      expect(unmarsheled.data).to.deep.equal(new Buffer('Hello UnixFS\n'))
      expect(unmarsheled.type).to.equal('file')
      expect(unmarsheled.marshal()).to.deep.equal(raw)
      done()
    })

    it.skip('metadata', (done) => {
    })

    it('symlink', (done) => {
      const raw = fs.readFileSync(path.join(__dirname, '../test-data/symlink.txt.unixfs'))
      const unmarsheled = UnixFS.unmarshal(raw)
      expect(unmarsheled.data).to.deep.equal(new Buffer('file.txt'))
      expect(unmarsheled.type).to.equal('symlink')
      // TODO: waiting on https://github.com/ipfs/js-ipfs-data-importing/issues/3#issuecomment-182440079
      // expect(unmarsheled.marshal()).to.deep.equal(raw)
      done()
    })
  })
})
