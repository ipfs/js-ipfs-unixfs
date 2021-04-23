'use strict'

const errCode = require('err-code')
const { UnixFS } = require('ipfs-unixfs')
const findShardCid = require('../../utils/find-cid-in-shard')
const { decode } = require('@ipld/dag-pb')

/**
 * @typedef {import('ipfs-unixfs-importer/src/types').BlockAPI}
 * @typedef {import('../../types').ExporterOptions} ExporterOptions
 * @typedef {import('../../types').UnixFSEntry} UnixFSEntry
 * @typedef {import('../../types').Resolve} Resolve
 * @typedef {import('../../types').Resolver} Resolver
 * @typedef {import('../../types').UnixfsV1Resolver} UnixfsV1Resolver
 * @typedef {import('@ipld/dag-pb').PBNode} PBNode
 */

/**
 * @param {PBNode} node
 * @param {string} name
 */
const findLinkCid = (node, name) => {
  const link = node.Links.find(link => link.Name === name)

  return link && link.Hash
}

/**
 * @type {{ [key: string]: UnixfsV1Resolver }}
 */
const contentExporters = {
  raw: require('./content/file'),
  file: require('./content/file'),
  directory: require('./content/directory'),
  'hamt-sharded-directory': require('./content/hamt-sharded-directory'),
  metadata: (cid, node, unixfs, path, resolve, depth, blockService) => {
    return () => []
  },
  symlink: (cid, node, unixfs, path, resolve, depth, blockService) => {
    return () => []
  }
}

/**
 * @type {Resolver}
 */
const unixFsResolver = async (cid, name, path, toResolve, resolve, depth, blockService, options) => {
  const block = await blockService.get(cid, options)
  const node = decode(block.bytes)
  let unixfs
  let next

  if (!name) {
    name = cid.toString()
  }

  if (node.Data == null) {
    throw errCode(new Error('no data in PBNode'), 'ERR_NOT_UNIXFS')
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
      linkCid = await findShardCid(node, toResolve[0], blockService)
    } else {
      linkCid = findLinkCid(node, toResolve[0])
    }

    if (!linkCid) {
      throw errCode(new Error('file does not exist'), 'ERR_NOT_FOUND')
    }

    // remove the path component we have resolved
    const nextName = toResolve.shift()
    const nextPath = `${path}/${nextName}`

    next = {
      cid: linkCid,
      toResolve,
      name: nextName || '',
      path: nextPath
    }
  }

  return {
    entry: {
      type: unixfs.isDirectory() ? 'directory' : 'file',
      name,
      path,
      cid,
      // @ts-ignore
      content: contentExporters[unixfs.type](cid, node, unixfs, path, resolve, depth, blockService),
      unixfs,
      depth,
      node,
      size: unixfs.fileSize()
    },
    next
  }
}

module.exports = unixFsResolver
