import { decode, type PBNode } from '@ipld/dag-pb'
import errCode from 'err-code'
import { UnixFS } from 'ipfs-unixfs'
import findShardCid from '../../utils/find-cid-in-shard.js'
import contentDirectory from './content/directory.js'
import contentFile from './content/file.js'
import contentHamtShardedDirectory from './content/hamt-sharded-directory.js'
import type { Resolver, UnixfsV1Resolver } from '../../index.js'
import type { CID } from 'multiformats/cid'

const findLinkCid = (node: PBNode, name: string): CID | undefined => {
  const link = node.Links.find(link => link.Name === name)

  return link?.Hash
}

const contentExporters: Record<string, UnixfsV1Resolver> = {
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

// @ts-expect-error types are wrong
const unixFsResolver: Resolver = async (cid, name, path, toResolve, resolve, depth, blockstore, options) => {
  const block = await blockstore.get(cid, options)
  const node = decode(block)
  let unixfs
  let next

  if (name == null) {
    name = cid.toString()
  }

  if (node.Data == null) {
    throw errCode(new Error('no data in PBNode'), 'ERR_NOT_UNIXFS')
  }

  try {
    unixfs = UnixFS.unmarshal(node.Data)
  } catch (err: any) {
    // non-UnixFS dag-pb node? It could happen.
    throw errCode(err, 'ERR_NOT_UNIXFS')
  }

  if (path == null) {
    path = name
  }

  if (toResolve.length > 0) {
    let linkCid

    if (unixfs?.type === 'hamt-sharded-directory') {
      // special case - unixfs v1 hamt shards
      linkCid = await findShardCid(node, toResolve[0], blockstore)
    } else {
      linkCid = findLinkCid(node, toResolve[0])
    }

    if (linkCid == null) {
      throw errCode(new Error('file does not exist'), 'ERR_NOT_FOUND')
    }

    // remove the path component we have resolved
    const nextName = toResolve.shift()
    const nextPath = `${path}/${nextName}`

    next = {
      cid: linkCid,
      toResolve,
      name: nextName ?? '',
      path: nextPath
    }
  }

  const content = contentExporters[unixfs.type](cid, node, unixfs, path, resolve, depth, blockstore)

  if (content == null) {
    throw errCode(new Error('could not find content exporter'), 'ERR_NOT_FOUND')
  }

  if (unixfs.isDirectory()) {
    return {
      entry: {
        type: 'directory',
        name,
        path,
        cid,
        content,
        unixfs,
        depth,
        node,
        size: unixfs.fileSize()
      },
      next
    }
  }

  return {
    entry: {
      type: 'file',
      name,
      path,
      cid,
      content,
      unixfs,
      depth,
      node,
      size: unixfs.fileSize()
    },
    next
  }
}

export default unixFsResolver
