/* globals describe, it */

const importer = require('./../src')
const expect = require('chai').expect
const IPFSRepo = require('ipfs-repo')
const BlockService = require('ipfs-blocks').BlockService
const DAGService = require('ipfs-merkle-dag').DAGService
const DAGNode = require('ipfs-merkle-dag').DAGNode
const fsBlobStore = require('fs-blob-store')
const bs58 = require('bs58')
const fs = require('fs')

describe('layout: importer', function () {
  // const big = __dirname + '/test-data/1.2MiB.txt'
  const small = __dirname + '/test-data/200Bytes.txt'

  var ds

  it('start blockService', function (done) {
    const options = {
      stores: {
        keys: fsBlobStore,
        config: fsBlobStore,
        datastore: fsBlobStore,
        // datastoreLegacy: needs https://github.com/ipfsBlobStore/js-ipfsBlobStore-repo/issues/6#issuecomment-164650642
        logs: fsBlobStore,
        locks: fsBlobStore,
        version: fsBlobStore
      }
    }

    var repo = new IPFSRepo(process.env.IPFS_PATH, options)
    var bs = new BlockService(repo)
    ds = new DAGService(bs)
    expect(bs).to.exist
    expect(ds).to.exist
    done()
  })

  it('import a small file', (done) => {
    importer.import({
      path: small,
      dagService: ds
    }, function (err, stat) {
      expect(err).to.not.exist
      ds.get(stat.Hash, (err, node) => {
        expect(err).to.not.exist
        const smallDAGNode = new DAGNode()
        smallDAGNode.unMarshal(fs.readFileSync(small + '.block'))
        expect(node.size()).to.equal(smallDAGNode.size())
        expect(node.multihash()).to.deep.equal(smallDAGNode.multihash())
        done()
      })
    })
  })

  it.skip('import a big file', (done) => {})
  it.skip('import a directory', (done) => {})
  it.skip('import a buffer', (done) => {})
  it.skip('import from a stream', (done) => {})
})

