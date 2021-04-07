'use strict'

const errCode = require('err-code')
const { CID } = require('multiformats/cid')
const resolve = require('./resolvers')
const last = require('it-last')

/**
 * @typedef {import('ipfs-unixfs').UnixFS} UnixFS
 * @typedef {import('ipfs-unixfs-importer/src/types').BlockAPI} BlockAPI
 * @typedef {import('./types').ExporterOptions} ExporterOptions
 * @typedef {import('./types').UnixFSFile} UnixFSFile
 * @typedef {import('./types').UnixFSDirectory} UnixFSDirectory
 * @typedef {import('./types').ObjectNode} ObjectNode
 * @typedef {import('./types').RawNode} RawNode
 * @typedef {import('./types').IdentityNode} IdentityNode
 * @typedef {import('./types').UnixFSEntry} UnixFSEntry
 */

const toPathComponents = (path = '') => {
  // split on / unless escaped with \
  return (path
    .trim()
    .match(/([^\\^/]|\\\/)+/g) || [])
    .filter(Boolean)
}

/**
 * @param {string|Uint8Array|CID} path
 */
const cidAndRest = (path) => {
  if (path instanceof Uint8Array) {
    return {
      cid: CID.decode(path),
      toResolve: []
    }
  }

  const cid = CID.asCID(path)
  if (cid) {
    return {
      cid,
      toResolve: []
    }
  }

  if (typeof path === 'string') {
    if (path.indexOf('/ipfs/') === 0) {
      path = path.substring(6)
    }

    const output = toPathComponents(path)

    return {
      cid: CID.parse(output[0]),
      toResolve: output.slice(1)
    }
  }

  throw errCode(new Error(`Unknown path type ${path}`), 'ERR_BAD_PATH')
}

/**
 * @param {string | CID} path
 * @param {BlockAPI} blockService
 * @param {ExporterOptions} [options]
 */
async function * walkPath (path, blockService, options = {}) {
  let {
    cid,
    toResolve
  } = cidAndRest(path)
  let name = cid.toString()
  let entryPath = name
  const startingDepth = toResolve.length

  while (true) {
    const result = await resolve(cid, name, entryPath, toResolve, startingDepth, blockService, options)

    if (!result.entry && !result.next) {
      throw errCode(new Error(`Could not resolve ${path}`), 'ERR_NOT_FOUND')
    }

    if (result.entry) {
      yield result.entry
    }

    if (!result.next) {
      return
    }

    // resolve further parts
    toResolve = result.next.toResolve
    cid = result.next.cid
    name = result.next.name
    entryPath = result.next.path
  }
}

/**
 * @param {string | CID} path
 * @param {BlockAPI} blockService
 * @param {ExporterOptions} [options]
 */
async function exporter (path, blockService, options = {}) {
  const result = await last(walkPath(path, blockService, options))

  if (!result) {
    throw errCode(new Error(`Could not resolve ${path}`), 'ERR_NOT_FOUND')
  }

  return result
}

/**
 * @param {string | CID} path
 * @param {BlockAPI} blockService
 * @param {ExporterOptions} [options]
 */
async function * recursive (path, blockService, options = {}) {
  const node = await exporter(path, blockService, options)

  if (!node) {
    return
  }

  yield node

  if (node.type === 'directory') {
    for await (const child of recurse(node, options)) {
      yield child
    }
  }

  /**
   * @param {UnixFSDirectory} node
   * @param {ExporterOptions} options
   * @returns {AsyncGenerator<UnixFSEntry, void, any>}
   */
  async function * recurse (node, options) {
    for await (const file of node.content(options)) {
      yield file

      if (file instanceof Uint8Array) {
        continue
      }

      if (file.type === 'directory') {
        yield * recurse(file, options)
      }
    }
  }
}

module.exports = {
  exporter,
  walkPath,
  recursive
}
