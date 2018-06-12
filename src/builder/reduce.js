'use strict'

const waterfall = require('async/waterfall')
const dagPB = require('ipld-dag-pb')
const UnixFS = require('ipfs-unixfs')
const CID = require('cids')

const DAGLink = dagPB.DAGLink
const DAGNode = dagPB.DAGNode

module.exports = function (file, ipld, options) {
  return function (leaves, callback) {
    if (leaves.length === 1 && leaves[0].single && options.reduceSingleLeafToSelf) {
      const leaf = leaves[0]

      if (!options.rawLeafNodes) {
        return callback(null, {
          path: file.path,
          multihash: leaf.multihash,
          size: leaf.size,
          leafSize: leaf.leafSize,
          name: leaf.name
        })
      }

      // we are using raw leaf nodes, this file only has one node but it'll be marked raw
      // so convert it back to a file node
      return waterfall([
        (cb) => ipld.get(new CID(leaf.multihash), cb),
        (result, cb) => {
          const meta = UnixFS.unmarshal(result.value.data)
          const fileNode = new UnixFS('file', meta.data)

          DAGNode.create(fileNode.marshal(), [], options.hashAlg, (err, node) => {
            cb(err, { DAGNode: node, fileNode: fileNode })
          })
        },
        (result, cb) => {
          let cid = new CID(result.DAGNode.multihash)

          if (options.cidVersion === 1) {
            cid = cid.toV1()
          }

          ipld.put(result.DAGNode, { cid }, (err) => cb(err, result))
        },
        (result, cb) => {
          cb(null, {
            multihash: result.DAGNode.multihash,
            size: result.DAGNode.size,
            leafSize: result.fileNode.fileSize(),
            name: ''
          })
        }
      ], callback)
    }

    // create a parent node and add all the leaves
    const f = new UnixFS('file')

    const links = leaves.map((leaf) => {
      f.addBlockSize(leaf.leafSize)

      return new DAGLink(leaf.name, leaf.size, leaf.multihash)
    })

    waterfall([
      (cb) => DAGNode.create(f.marshal(), links, options.hashAlg, cb),
      (node, cb) => {
        if (options.onlyHash) return cb(null, node)

        let cid = new CID(node.multihash)

        if (options.cidVersion === 1) {
          cid = cid.toV1()
        }

        ipld.put(node, { cid }, (err) => cb(err, node))
      }
    ], (err, node) => {
      if (err) {
        callback(err)
        return // early
      }

      const root = {
        name: '',
        path: file.path,
        multihash: node.multihash,
        size: node.size,
        leafSize: f.fileSize()
      }

      callback(null, root)
    })
  }
}
