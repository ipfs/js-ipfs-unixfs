'use strict'

const errCode = require('err-code')
const UnixFS = require('ipfs-unixfs')
const findShardCid = require('../../utils/find-cid-in-shard')

const findLinkCid = (node, name) => {
  const link = node.Links.find(link => link.Name === name)

  return link && link.Hash
}

const contentExporters = {
  raw: require('./content/file'),
  file: require('./content/file'),
  directory: require('./content/directory'),
  'hamt-sharded-directory': require('./content/hamt-sharded-directory'),
  metadata: (cid, node, unixfs, path, resolve, depth, ipld) => {},
  symlink: (cid, node, unixfs, path, resolve, depth, ipld) => {}
}

const unixFsResolver = async (cid, name, path, toResolve, resolve, depth, ipld) => {
  const node = await ipld.get(cid)
  let unixfs
  let next

  if (!name) {
    name = cid.toBaseEncodedString()
  }

  try {
    unixfs = UnixFS.unmarshal(node.Data)
  } catch (err) {
    // non-UnixFS dag-pb node? It could happen.
    throw errCode(err, 'ERR_NOT_UNIXFS')
  }

  if (!path) {
    path = name
  }

  if (toResolve.length) {
    let linkCid

    if (unixfs && unixfs.type === 'hamt-sharded-directory') {
      // special case - unixfs v1 hamt shards
      linkCid = await findShardCid(node, toResolve[0], ipld)
    } else {
      linkCid = findLinkCid(node, toResolve[0])
    }

    if (!linkCid) {
      throw errCode(new Error(`file does not exist`), 'ERR_NOT_FOUND')
    }

    // remove the path component we have resolved
    const nextName = toResolve.shift()
    const nextPath = `${path}/${nextName}`

    next = {
      cid: linkCid,
      toResolve,
      name: nextName,
      path: nextPath
    }
  }

  return {
    entry: {
      name,
      path,
      cid,
      node,
      content: contentExporters[unixfs.type](cid, node, unixfs, path, resolve, depth, ipld),
      unixfs,
      depth
    },
    next
  }
}

module.exports = unixFsResolver
