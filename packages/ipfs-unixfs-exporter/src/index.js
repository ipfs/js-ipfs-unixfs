'use strict'

const errCode = require('err-code')
const CID = require('cids')
const resolve = require('./resolvers')
const last = require('it-last')

const toPathComponents = (path = '') => {
  // split on / unless escaped with \
  return (path
    .trim()
    .match(/([^\\^/]|\\\/)+/g) || [])
    .filter(Boolean)
}

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

const walkPath = async function * (path, ipld, options) {
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

const exporter = (path, ipld, options) => {
  return last(walkPath(path, ipld, options))
}

const recursive = async function * (path, ipld, options) {
  const node = await exporter(path, ipld, options)

  yield node

  if (node.unixfs && node.unixfs.type.includes('dir')) {
    for await (const child of recurse(node, options)) {
      yield child
    }
  }

  async function * recurse (node, options) {
    for await (const file of node.content(options)) {
      yield file

      if (file.unixfs.type.includes('dir')) {
        for await (const subFile of recurse(file, options)) {
          yield subFile
        }
      }
    }
  }
}

module.exports = exporter
module.exports.path = walkPath
module.exports.recursive = recursive
