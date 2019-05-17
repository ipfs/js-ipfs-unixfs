'use strict'

const errCode = require('err-code')
const CID = require('cids')
const resolve = require('./resolvers')
const last = require('async-iterator-last')

const toPathComponents = (path = '') => {
  // split on / unless escaped with \
  return (path
    .trim()
    .match(/([^\\^/]|\\\/)+/g) || [])
    .filter(Boolean)
}

const cidAndRest = (path) => {
  if (Buffer.isBuffer(path)) {
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

const walkPath = async function * (path, ipld) {
  let {
    cid,
    toResolve
  } = cidAndRest(path)
  let name = cid.toBaseEncodedString()
  let entryPath = name
  const startingDepth = toResolve.length

  while (true) {
    const result = await resolve(cid, name, entryPath, toResolve, startingDepth, ipld)

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

const exporter = (path, ipld) => {
  return last(walkPath(path, ipld))
}

const recursive = async function * (path, ipld) {
  const node = await exporter(path, ipld)

  yield node

  if (node.unixfs && node.unixfs.type.includes('dir')) {
    for await (const child of recurse(node)) {
      yield child
    }
  }

  async function * recurse (node) {
    for await (const file of node.content()) {
      yield file

      if (file.unixfs.type.includes('dir')) {
        for await (const subFile of recurse(file)) {
          yield subFile
        }
      }
    }
  }
}

module.exports = exporter
module.exports.path = walkPath
module.exports.recursive = recursive
