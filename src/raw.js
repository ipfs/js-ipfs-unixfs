'use strict'

const error = require('pull-stream/sources/error')
const once = require('pull-stream/sources/once')
const empty = require('pull-stream/sources/empty')
const extractDataFromBlock = require('./extract-data-from-block')

// Logic to export a single raw block
module.exports = (cid, node, name, path, pathRest, resolve, dag, parent, depth, options) => {
  const accepts = pathRest[0]

  if (accepts !== undefined && accepts !== path) {
    return empty()
  }

  const size = node.length

  let offset = options.offset
  let length = options.length

  if (offset < 0) {
    return error(new Error('Offset must be greater than or equal to 0'))
  }

  if (offset > size) {
    return error(new Error('Offset must be less than the file size'))
  }

  if (length < 0) {
    return error(new Error('Length must be greater than or equal to 0'))
  }

  if (length === 0) {
    return once({
      depth,
      content: once(Buffer.alloc(0)),
      cid,
      name,
      path,
      size,
      type: 'raw'
    })
  }

  if (!offset) {
    offset = 0
  }

  if (!length || (offset + length > size)) {
    length = size - offset
  }

  return once({
    depth,
    content: once(extractDataFromBlock(node, 0, offset, offset + length)),
    cid,
    name,
    path,
    size,
    type: 'raw'
  })
}
