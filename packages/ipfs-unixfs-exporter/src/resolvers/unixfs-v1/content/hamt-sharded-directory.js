'use strict'

/**
 * @typedef {import('../../../').ExporterOptions} ExporterOptions
 * @typedef {import('ipld-dag-pb').DAGNode} DAGNode
 * @typedef {import('../../').Resolve} Resolve
 * @typedef {import('../../../').IPLDResolver} IPLDResolver
 * @typedef {import('../').UnixfsV1DirectoryContent} UnixfsV1DirectoryContent
 *
 * @type {import('../').UnixfsV1Resolver}
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
 * @param {IPLDResolver} ipld
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
