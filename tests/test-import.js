/* globals describe, it */

var importer = require('./../src')
var expect = require('chai').expect
var IPFSRepo = require('ipfs-repo')
var BlockService = require('ipfs-blocks').BlockService
const fs = require('fs-blob-store')
var bs58 = require('bs58')

describe('layout: importer', function () {
  // var medium = __dirname + '/test-data/1MiB.txt'
  var small = __dirname + '/test-data/200Bytes.txt'

  var bs

  it('start blockService', function (done) {
    const options = {
      stores: {
        keys: fs,
        config: fs,
        datastore: fs,
        // datastoreLegacy: needs https://github.com/ipfs/js-ipfs-repo/issues/6#issuecomment-164650642
        logs: fs,
        locks: fs,
        version: fs
      }
    }

    var repo = new IPFSRepo(process.env.IPFS_PATH, options)
    bs = new BlockService(repo)
    expect(bs).to.exist
    done()
  })

  it('run importer through a file', function (done) {
    importer.import({
      path: small,
      blockService: bs
    }, function (err, res) {
      expect(err).to.not.exist
      console.log(bs58.encode(res.Hash))
      console.log(res.Size)
      done()
    })
  })
})

