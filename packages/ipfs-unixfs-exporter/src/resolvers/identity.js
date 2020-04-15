'use strict'

const errCode = require('err-code')
const extractDataFromBlock = require('../utils/extract-data-from-block')
const validateOffsetAndLength = require('../utils/validate-offset-and-length')
const mh = require('multihashing-async').multihash

const rawContent = (node) => {
  return function * (options = {}) {
    const {
      offset,
      length
    } = validateOffsetAndLength(node.length, options.offset, options.length)

    yield extractDataFromBlock(node, 0, offset, offset + length)
  }
}

const resolve = async (cid, name, path, toResolve, resolve, depth, ipld, options) => {
  if (toResolve.length) {
    throw errCode(new Error(`No link named ${path} found in raw node ${cid.toBaseEncodedString()}`), 'ERR_NOT_FOUND')
  }

  const buf = await mh.decode(cid.multihash)

  return {
    entry: {
      name,
      path,
      cid,
      node: buf,
      content: rawContent(buf.digest),
      depth
    }
  }
}

module.exports = resolve
