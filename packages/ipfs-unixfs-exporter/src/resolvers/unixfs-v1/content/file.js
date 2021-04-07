'use strict'

const extractDataFromBlock = require('../../../utils/extract-data-from-block')
const validateOffsetAndLength = require('../../../utils/validate-offset-and-length')
const { UnixFS } = require('ipfs-unixfs')
const errCode = require('err-code')
// @ts-ignore
const dagPb = require('@ipld/dag-pb')
const dagCbor = require('@ipld/dag-cbor')
const mc = require('multicodec')

/**
 * @typedef {import('../../../types').ExporterOptions} ExporterOptions
 * @typedef {import('ipfs-unixfs-importer/src/types').BlockAPI} BlockService
 * @typedef {import('../../../types').PbNode} PbNode
 *
 * @param {BlockService} blockService
 * @param {PbNode} node
 * @param {number} start
 * @param {number} end
 * @param {number} streamPosition
 * @param {ExporterOptions} options
 * @returns {AsyncIterable<Uint8Array>}
 */
async function * emitBytes (blockService, node, start, end, streamPosition = 0, options) {
  // a `raw` node
  if (node instanceof Uint8Array) {
    const buf = extractDataFromBlock(node, streamPosition, start, end)

    if (buf.length) {
      yield buf
    }

    streamPosition += buf.length

    return streamPosition
  }

  let file

  try {
    file = UnixFS.unmarshal(node.Data)
  } catch (err) {
    throw errCode(err, 'ERR_NOT_UNIXFS')
  }

  // might be a unixfs `raw` node or have data on intermediate nodes
  if (file.data && file.data.length) {
    const buf = extractDataFromBlock(file.data, streamPosition, start, end)

    if (buf.length) {
      yield buf
    }

    streamPosition += file.data.length
  }

  let childStart = streamPosition

  // work out which child nodes contain the requested data
  for (let i = 0; i < node.Links.length; i++) {
    const childLink = node.Links[i]
    const childEnd = streamPosition + file.blockSizes[i]

    if ((start >= childStart && start < childEnd) || // child has offset byte
        (end > childStart && end <= childEnd) || // child has end byte
        (start < childStart && end > childEnd)) { // child is between offset and end bytes
      const block = await blockService.get(childLink.Hash, {
        signal: options.signal
      })
      let child
      switch (childLink.Hash.code) {
        case mc.DAG_PB:
          child = await dagPb.decode(block.bytes)
          break
        case mc.RAW:
          child = block.bytes
          break
        case mc.DAG_CBOR:
          // @ts-ignore - TODO vmx 2021-04-01: will work once js-dag-cbor has proper types
          child = await dagCbor.decode(block.bytes)
          break
        default:
          // TODO vmx 2021-03-05: fix this type issue properly
          // @ts-ignore
          throw Error(`Unsupported codec: ${mc.getName(childLink.Hash.code)}`)
      }

      for await (const buf of emitBytes(blockService, child, start, end, streamPosition, options)) {
        streamPosition += buf.length

        yield buf
      }
    }

    streamPosition = childEnd
    childStart = childEnd + 1
  }
}

/**
 * @type {import('../').UnixfsV1Resolver}
 */
const fileContent = (cid, node, unixfs, path, resolve, depth, blockService) => {
  /**
   * @param {ExporterOptions} options
   */
  function yieldFileContent (options = {}) {
    const fileSize = unixfs.fileSize()

    if (fileSize === undefined) {
      throw new Error('File was a directory')
    }

    const {
      offset,
      length
    } = validateOffsetAndLength(fileSize, options.offset, options.length)

    const start = offset
    const end = offset + length

    return emitBytes(blockService, node, start, end, 0, options)
  }

  return yieldFileContent
}

module.exports = fileContent
