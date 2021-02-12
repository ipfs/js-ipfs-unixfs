'use strict'

/**
 * @typedef {import('../../../').ExporterOptions} ExporterOptions
 * @typedef {import('../').UnixfsV1DirectoryContent} UnixfsV1DirectoryContent
 *
 * @type {import('../').UnixfsV1Resolver}
 */
const directoryContent = (cid, node, unixfs, path, resolve, depth, ipld) => {
  /**
   * @param {ExporterOptions} [options]
   * @returns {UnixfsV1DirectoryContent}
   */
  async function * yieldDirectoryContent (options = {}) {
    const offset = options.offset || 0
    const length = options.length || node.Links.length
    const links = node.Links.slice(offset, length)

    for (const link of links) {
      const result = await resolve(link.Hash, link.Name, `${path}/${link.Name}`, [], depth + 1, ipld, options)

      if (result.entry) {
        yield result.entry
      }
    }
  }

  return yieldDirectoryContent
}

module.exports = directoryContent
