'use strict'

const errCode = require('err-code')
const CID = require('cids')
const resolve = require('./resolvers')
const last = require('it-last')

/**
 * @typedef {import('ipfs-unixfs')} UnixFS
 * @typedef {import('ipld-dag-pb').DAGNode} DAGNode
 * @typedef {import('ipfs-core-types/src/ipld').IPLD} IPLD
 *
 * @typedef {object} UnixFSFile
 * @property {'file'} type
 * @property {string} name
 * @property {string} path
 * @property {CID} cid
 * @property {number} depth
 * @property {UnixFS} unixfs
 * @property {DAGNode} node
 * @property {(options?: ExporterOptions) => AsyncIterable<Uint8Array>} content
 *
 * @typedef {object} UnixFSDirectory
 * @property {'directory'} type
 * @property {string} name
 * @property {string} path
 * @property {CID} cid
 * @property {number} depth
 * @property {UnixFS} unixfs
 * @property {DAGNode} node
 * @property {(options?: ExporterOptions) => AsyncIterable<UnixFSEntry>} content
 *
 * @typedef {object} ObjectNode
 * @property {'object'} type
 * @property {string} name
 * @property {string} path
 * @property {CID} cid
 * @property {number} depth
 * @property {any} node
 *
 * @typedef {object} RawNode
 * @property {'raw'} type
 * @property {string} name
 * @property {string} path
 * @property {CID} cid
 * @property {number} depth
 * @property {Uint8Array} node
 * @property {(options?: ExporterOptions) => AsyncIterable<Uint8Array>} content
 *
 * @typedef {object} IdentityNode
 * @property {'identity'} type
 * @property {string} name
 * @property {string} path
 * @property {CID} cid
 * @property {number} depth
 * @property {Uint8Array} node
 * @property {(options?: ExporterOptions) => AsyncIterable<Uint8Array>} content
 *
 * @typedef {UnixFSFile | UnixFSDirectory | ObjectNode | RawNode | IdentityNode} UnixFSEntry
 */

/**
 * @typedef {object} ExporterOptions
 * @property {number} [offset=0]
 * @property {number} [length]
 * @property {AbortSignal} [signal]
 * @property {number} [timeout]
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
      cid: new CID(path),
      toResolve: []
    }
  }

  if (CID.isCID(path)) {
    return {
      cid: path,
      toResolve: []
    }
  }

  if (typeof path === 'string') {
    if (path.indexOf('/ipfs/') === 0) {
      path = path.substring(6)
    }

    const output = toPathComponents(path)

    return {
      cid: new CID(output[0]),
      toResolve: output.slice(1)
    }
  }

  throw errCode(new Error(`Unknown path type ${path}`), 'ERR_BAD_PATH')
}

/**
 * @param {string | CID} path
 * @param {IPLD} ipld
 * @param {ExporterOptions} [options]
 */
const walkPath = async function * (path, ipld, options = {}) {
  let {
    cid,
    toResolve
  } = cidAndRest(path)
  let name = cid.toBaseEncodedString()
  let entryPath = name
  const startingDepth = toResolve.length

  while (true) {
    const result = await resolve(cid, name, entryPath, toResolve, startingDepth, ipld, options)

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
 * @param {IPLD} ipld
 * @param {ExporterOptions} [options]
 */
const exporter = async (path, ipld, options = {}) => {
  const result = await last(walkPath(path, ipld, options))

  if (!result) {
    throw errCode(new Error(`Could not resolve ${path}`), 'ERR_NOT_FOUND')
  }

  return result
}

/**
 * @param {string | CID} path
 * @param {IPLD} ipld
 * @param {ExporterOptions} [options]
 */
const recursive = async function * (path, ipld, options = {}) {
  const node = await exporter(path, ipld, options)

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

exporter.path = walkPath
exporter.recursive = recursive

module.exports = exporter
