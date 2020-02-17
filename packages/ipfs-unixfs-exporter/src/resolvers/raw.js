'use strict'

const errCode = require('err-code')
const extractDataFromBlock = require('../utils/extract-data-from-block')
const validateOffsetAndLength = require('../utils/validate-offset-and-length')

const rawContent = (node) => {
  return function * (options = {}) {
    const {
      offset,
      length
    } = validateOffsetAndLength(node.length, options.offset, options.length)

    yield extractDataFromBlock(node, 0, offset, offset + length)
  }
}

const resolve = async (cid, name, path, toResolve, resolve, depth, ipld) => {
  if (toResolve.length) {
    throw errCode(new Error(`No link named ${path} found in raw node ${cid.toBaseEncodedString()}`), 'ERR_NOT_FOUND')
  }

  const buf = await ipld.get(cid)

  return {
    entry: {
      name,
      path,
      cid,
      node: buf,
      content: rawContent(buf),
      depth
    }
  }
}

module.exports = resolve
