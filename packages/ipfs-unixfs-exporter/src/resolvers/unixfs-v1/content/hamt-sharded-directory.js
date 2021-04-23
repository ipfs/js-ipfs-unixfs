'use strict'

const { decode } = require('@ipld/dag-pb')

/**
 * @typedef {import('ipfs-unixfs-importer/src/types').BlockAPI} BlockAPI
 * @typedef {import('../../../types').ExporterOptions} ExporterOptions
 * @typedef {import('../../../types').Resolve} Resolve
 * @typedef {import('../../../types').UnixfsV1DirectoryContent} UnixfsV1DirectoryContent
 * @typedef {import('../../../types').UnixfsV1Resolver} UnixfsV1Resolver
 * @typedef {import('@ipld/dag-pb').PBNode} PBNode
 */

/**
 * @type {UnixfsV1Resolver}
 */
const hamtShardedDirectoryContent = (cid, node, unixfs, path, resolve, depth, blockService) => {
  /**
   * @param {ExporterOptions} options
   *
   */
  function yieldHamtDirectoryContent (options = {}) {
    return listDirectory(node, path, resolve, depth, blockService, options)
  }

  return yieldHamtDirectoryContent
}

/**
 * @param {PBNode} node
 * @param {string} path
 * @param {Resolve} resolve
 * @param {number} depth
 * @param {BlockAPI} blockService
 * @param {ExporterOptions} options
 *
 * @returns {UnixfsV1DirectoryContent}
 */
async function * listDirectory (node, path, resolve, depth, blockService, options) {
  const links = node.Links

  for (const link of links) {
    const name = link.Name != null ? link.Name.substring(2) : null

    if (name) {
      const result = await resolve(link.Hash, name, `${path}/${name}`, [], depth + 1, blockService, options)

      yield result.entry
    } else {
      // descend into subshard
      const block = await blockService.get(link.Hash)
      node = decode(block.bytes)

      for await (const file of listDirectory(node, path, resolve, depth, blockService, options)) {
        yield file
      }
    }
  }
}

module.exports = hamtShardedDirectoryContent
