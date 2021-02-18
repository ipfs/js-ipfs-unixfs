'use strict'

const errCode = require('err-code')
const UnixFS = require('ipfs-unixfs')
const findShardCid = require('../../utils/find-cid-in-shard')

/**
 * @typedef {import('../../').ExporterOptions} ExporterOptions
 * @typedef {import('../../').IPLDResolver} IPLDResolver
 * @typedef {import('../').UnixFSEntry} UnixFSEntry
 * @typedef {import('cids')} CID
 * @typedef {import('ipld-dag-pb').DAGNode} DAGNode
 * @typedef {import('../').Resolve} Resolve
 */

/**
 * @param {import('ipld-dag-pb').DAGNode} node
 * @param {string} name
 */
const findLinkCid = (node, name) => {
  const link = node.Links.find(link => link.Name === name)

  return link && link.Hash
}

/**
 * @typedef {AsyncIterable<Uint8Array> | Iterable<Uint8Array>} UnixfsV1FileContent
 * @typedef {AsyncIterable<UnixFSEntry> | Iterable<UnixFSEntry>} UnixfsV1DirectoryContent
 *
 * @typedef {UnixfsV1FileContent | UnixfsV1DirectoryContent} UnixfsV1Content
 * @typedef {(cid: CID, node: DAGNode, unixfs: UnixFS, path: string, resolve: Resolve, depth: number, ipld: IPLDResolver) => (options: ExporterOptions) => UnixfsV1Content } UnixfsV1Resolver
 *
 * @type {{ [key: string]: UnixfsV1Resolver }}
 */
const contentExporters = {
  raw: require('./content/file'),
  file: require('./content/file'),
  directory: require('./content/directory'),
  'hamt-sharded-directory': require('./content/hamt-sharded-directory'),
  metadata: (cid, node, unixfs, path, resolve, depth, ipld) => {
    return () => []
  },
  symlink: (cid, node, unixfs, path, resolve, depth, ipld) => {
    return () => []
  }
}

/**
 * @type {import('../').Resolver}
 */
const unixFsResolver = async (cid, name, path, toResolve, resolve, depth, ipld, options) => {
  const node = await ipld.get(cid, options)
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
      content: contentExporters[unixfs.type](cid, node, unixfs, path, resolve, depth, ipld),
      unixfs,
      depth,
      node
    },
    next
  }
}

module.exports = unixFsResolver
