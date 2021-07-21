/* eslint-env mocha */

// @ts-ignore needs proper types export for paths
import { expect } from 'aegir/utils/chai.js'

/** @type {(path: string) => Uint8Array} */
// @ts-ignore
import loadFixture from 'aegir/utils/fixtures.js'
import uint8ArrayFromString from 'uint8arrays/from-string.js'

import { UnixFS } from '../src/index.js'
import * as Pb from '../src/unixfs.js'
const PBData = Pb.Data

const raw = loadFixture('test/fixtures/raw.unixfs')
const directory = loadFixture('test/fixtures/directory.unixfs')
const file = loadFixture('test/fixtures/file.txt.unixfs')
const symlink = loadFixture('test/fixtures/symlink.txt.unixfs')

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
      data: uint8ArrayFromString('bananas')
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
      data: uint8ArrayFromString('batata')
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
    // @ts-ignore it's ok, really
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

  it.skip('sets mtime to 0 as BigInt', () => {
    const mtime = {
      secs: 0,
      nsecs: 0
    }
    const data = new UnixFS({
      type: 'file'
      // TODO: https://github.com/ipfs/aegir/issues/487
      // mtime: BigInt(0)
    })

    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.have.deep.property('mtime', mtime)
  })

  it.skip('sets mtime to 0 as BigInt literal', () => {
    const mtime = {
      secs: 0,
      nsecs: 0
    }
    const data = new UnixFS({
      type: 'file'
      // TODO: https://github.com/ipfs/aegir/issues/487
      // mtime: 0n
    })

    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.have.deep.property('mtime', mtime)
  })

  it('sets mtime to 0 as Date', () => {
    const mtime = {
      secs: 0,
      nsecs: 0
    }
    const data = new UnixFS({
      type: 'file',
      mtime: new Date(0)
    })

    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.have.deep.property('mtime', mtime)
  })

  it('sets mtime to 0 as hrtime', () => {
    const mtime = {
      secs: 0,
      nsecs: 0
    }
    const data = new UnixFS({
      type: 'file',
      mtime: [0, 0]
    })

    const marshaled = data.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.have.deep.property('mtime', mtime)
  })

  it('survives undefined mtime', () => {
    const entry = new UnixFS({
      type: 'file',
      mtime: undefined
    })

    const marshaled = entry.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)
    expect(unmarshaled).to.not.have.property('mtime')
  })

  it('does not overwrite unknown mode bits', () => {
    const mode = 0xFFFFFFF // larger than currently defined mode bits
    const buf = PBData.encode({
      Type: 0,
      mode
    }).finish()

    const unmarshaled = UnixFS.unmarshal(buf)
    const marshaled = unmarshaled.marshal()

    const entry = PBData.decode(marshaled)
    expect(entry).to.have.property('mode', mode)
  })

  it('omits default file mode from protobuf', () => {
    const entry = new UnixFS({
      type: 'file',
      mode: 0o644
    })

    const marshaled = entry.marshal()
    const protobuf = PBData.decode(marshaled)
    const object = PBData.toObject(protobuf, {
      defaults: false
    })
    expect(object).not.to.have.property('mode')
  })

  it('omits default directory mode from protobuf', () => {
    const entry = new UnixFS({
      type: 'directory',
      mode: 0o755
    })

    const marshaled = entry.marshal()
    const protobuf = PBData.decode(marshaled)
    const object = PBData.toObject(protobuf, {
      defaults: false
    })
    expect(object).not.to.have.property('mode')
  })

  it('respects high bits in mode read from buffer', () => {
    const mode = 0o0100644 // similar to output from fs.stat
    const buf = PBData.encode({
      Type: PBData.DataType.File,
      mode
    }).finish()

    const entry = UnixFS.unmarshal(buf)

    // should have truncated mode to bits in the version of the spec this module supports
    expect(entry).to.have.property('mode', 0o644)

    const marshaled = entry.marshal()

    const protobuf = PBData.decode(marshaled)
    expect(protobuf).to.have.property('mode', mode)
  })

  it('ignores high bits in mode passed to constructor', () => {
    const mode = 0o0100644 // similar to output from fs.stat
    const entry = new UnixFS({
      type: 'file',
      mode
    })

    // should have truncated mode to bits in the version of the spec this module supports
    expect(entry).to.have.property('mode', 0o644)

    const marshaled = entry.marshal()
    const unmarshaled = UnixFS.unmarshal(marshaled)

    expect(unmarshaled).to.have.property('mode', 0o644)

    const protobuf = PBData.decode(marshaled)
    const object = PBData.toObject(protobuf, {
      defaults: false
    })
    expect(object).not.to.have.property('mode')
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
      expect(unmarshaled.data).to.eql(uint8ArrayFromString('Hello UnixFS\n'))
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
      expect(unmarshaled.data).to.deep.equal(uint8ArrayFromString('Hello UnixFS\n'))
      expect(unmarshaled.type).to.equal('file')
      expect(unmarshaled.marshal()).to.deep.equal(file)
    })

    it.skip('metadata', () => {
    })

    it('symlink', () => {
      const unmarshaled = UnixFS.unmarshal(symlink)
      expect(unmarshaled.data).to.deep.equal(uint8ArrayFromString('file.txt'))
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

    expect(marshaled).to.deep.equal(Uint8Array.from([0x08, 0x02, 0x18, 0x00]))
  })
})
