import errCode from 'err-code'
import { UnixFS } from 'ipfs-unixfs'
import findShardCid from '../../utils/find-cid-in-shard.js'
import { decode } from '@ipld/dag-pb'

import contentFile from './content/file.js'
import contentDirectory from './content/directory.js'
import contentHamtShardedDirectory from './content/hamt-sharded-directory.js'

/**
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
  raw: contentFile,
  file: contentFile,
  directory: contentDirectory,
  'hamt-sharded-directory': contentHamtShardedDirectory,
  metadata: (cid, node, unixfs, path, resolve, depth, blockstore) => {
    return () => []
  },
  symlink: (cid, node, unixfs, path, resolve, depth, blockstore) => {
    return () => []
  }
}

/**
 * @type {Resolver}
 */
const unixFsResolver = async (cid, name, path, toResolve, resolve, depth, blockstore, options) => {
  const block = await blockstore.get(cid, options)
  const node = decode(block)
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
  } catch (/** @type {any} */ err) {
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
      linkCid = await findShardCid(node, toResolve[0], blockstore)
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
      content: contentExporters[unixfs.type](cid, node, unixfs, path, resolve, depth, blockstore),
      unixfs,
      depth,
      node,
      size: unixfs.fileSize()
    },
    next
  }
}

export default unixFsResolver
