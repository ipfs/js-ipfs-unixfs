'use strict'

const directoryContent = (cid, node, unixfs, path, resolve, depth, ipld) => {
  return async function * (options = {}) {
    const offset = options.offset || 0
    const length = options.length || node.Links.length
    const links = node.Links.slice(offset, length)

    for (const link of links) {
      const result = await resolve(link.Hash, link.Name, `${path}/${link.Name}`, [], depth + 1, ipld)

      yield result.entry
    }
  }
}

module.exports = directoryContent
