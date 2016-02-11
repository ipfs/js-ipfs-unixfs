/* globals describe, it */

const importer = require('./../src')
const expect = require('chai').expect
const IPFSRepo = require('ipfs-repo')
const BlockService = require('ipfs-blocks').BlockService
const DAGService = require('ipfs-merkle-dag').DAGService
const DAGNode = require('ipfs-merkle-dag').DAGNode
const fsBlobStore = require('fs-blob-store')
// const bs58 = require('bs58')
const fs = require('fs')
const UnixFS = require('ipfs-unixfs')

describe('layout: importer', function () {
  const big = __dirname + '/test-data/1.2MiB.txt'
  const small = __dirname + '/test-data/200Bytes.txt'

  var ds

  it('start dag service', function (done) {
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

  it('import a big file', (done) => {
    // const big = __dirname + '/test-data/test-file.txt'

    importer.import({
      path: big,
      dagService: ds
    }, function (err, stat) {
      expect(err).to.not.exist
      ds.get(stat.Hash, (err, node) => {
        expect(err).to.not.exist

        const bigDAGNode = new DAGNode()
        bigDAGNode.unMarshal(fs.readFileSync(big + '.block'))
        expect(node.size()).to.equal(bigDAGNode.size())
        expect(node.links).to.deep.equal(bigDAGNode.links)

        const nodeUnixFS = UnixFS.unmarshal(node.data)
        const bigDAGNodeUnixFS = UnixFS.unmarshal(bigDAGNode.data)
        expect(nodeUnixFS.type).to.equal(bigDAGNodeUnixFS.type)
        expect(nodeUnixFS.data).to.deep.equal(bigDAGNodeUnixFS.data)
        expect(nodeUnixFS.blockSizes).to.deep.equal(bigDAGNodeUnixFS.blockSizes)
        expect(nodeUnixFS.fileSize()).to.equal(bigDAGNodeUnixFS.fileSize())

        expect(node.data).to.deep.equal(bigDAGNode.data)
        expect(node.multihash()).to.deep.equal(bigDAGNode.multihash())

        ds.get(node.links[0].hash, (err, node) => {
          expect(err).to.not.exist
          const leaf = new DAGNode()
          leaf.unMarshal(fs.readFileSync(big + '.link-block0'))
          expect(node.links).to.deep.equal(leaf.links)
          expect(node.links.length).to.equal(0)
          expect(leaf.links.length).to.equal(0)
          expect(leaf.marshal()).to.deep.equal(fs.readFileSync(big + '.link-block0'))
          const nodeUnixFS = UnixFS.unmarshal(node.data)
          const leafUnixFS = UnixFS.unmarshal(leaf.data)
          expect(nodeUnixFS.type).to.equal(leafUnixFS.type)
          expect(nodeUnixFS.fileSize()).to.equal(leafUnixFS.fileSize())
          expect(nodeUnixFS.data).to.deep.equal(leafUnixFS.data)
          expect(nodeUnixFS.blockSizes).to.deep.equal(leafUnixFS.blockSizes)
          expect(node.data).to.deep.equal(leaf.data)
          expect(node.marshal()).to.deep.equal(leaf.marshal())
          done()
        })
      })
    })
  })

  it.skip('import a directory', (done) => {})
  it.skip('import a buffer', (done) => {})
  it.skip('import from a stream', (done) => {})
})

