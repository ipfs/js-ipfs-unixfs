'use strict'

/**
 * @typedef {import('ipld-dag-pb').DAGNode} DAGNode
 * @typedef {import('ipld')} IPLD
 * @typedef {import('../../../types').ExporterOptions} ExporterOptions
 * @typedef {import('../../../types').Resolve} Resolve
 * @typedef {import('../../../types').UnixfsV1DirectoryContent} UnixfsV1DirectoryContent
 * @typedef {import('../../../types').UnixfsV1Resolver} UnixfsV1Resolver
 */

/**
 * @type {UnixfsV1Resolver}
 */
const hamtShardedDirectoryContent = (cid, node, unixfs, path, resolve, depth, ipld) => {
  /**
   * @param {ExporterOptions} options
   *
   */
  function yieldHamtDirectoryContent (options = {}) {
    return listDirectory(node, path, resolve, depth, ipld, options)
  }

  return yieldHamtDirectoryContent
}

/**
 * @param {DAGNode} node
 * @param {string} path
 * @param {Resolve} resolve
 * @param {number} depth
 * @param {IPLD} ipld
 * @param {ExporterOptions} options
 *
 * @returns {UnixfsV1DirectoryContent}
 */
async function * listDirectory (node, path, resolve, depth, ipld, options) {
  const links = node.Links

  for (const link of links) {
    const name = link.Name.substring(2)

    if (name) {
      const result = await resolve(link.Hash, name, `${path}/${name}`, [], depth + 1, ipld, options)

      yield result.entry
    } else {
      // descend into subshard
      node = await ipld.get(link.Hash)

      for await (const file of listDirectory(node, path, resolve, depth, ipld, options)) {
        yield file
      }
    }
  }
}

module.exports = hamtShardedDirectoryContent
