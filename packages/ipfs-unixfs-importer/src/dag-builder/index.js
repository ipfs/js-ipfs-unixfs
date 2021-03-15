'use strict'

const dirBuilder = require('./dir')
const fileBuilder = require('./file')
const errCode = require('err-code')

/**
 * @typedef {import('../types').File} File
 * @typedef {import('../types').Directory} Directory
 * @typedef {import('../types').DAGBuilder} DAGBuilder
 * @typedef {import('../types').Chunker} Chunker
 * @typedef {import('../types').ChunkValidator} ChunkValidator
 */

/**
 * @param {any} item
 * @returns {item is ArrayLike<number>}
 */
function isArrayLike (item) {
  return (
    Array.isArray(item) ||
      (Boolean(item) &&
        typeof item === 'object' &&
        typeof (item.length) === 'number' &&
        (item.length === 0 ||
           (item.length > 0 &&
           (item.length - 1) in item)
        )
      )
  )
}

/**
 * @type {DAGBuilder}
 */
async function * dagBuilder (source, block, options) {
  for await (const entry of source) {
    if (entry.path) {
      if (entry.path.substring(0, 2) === './') {
        options.wrapWithDirectory = true
      }

      entry.path = entry.path
        .split('/')
        .filter(path => path && path !== '.')
        .join('/')
    }

    if (entry.content) {
      const source = entry.content

      /** @type {AsyncIterable<string | Uint8Array | ArrayLike<number>>} */
      const content = (async function * () {
        // wrap in iterator if it is a, string, Uint8Array or array-like
        if (typeof source === 'string' || isArrayLike(source)) {
          yield source
          // @ts-ignore
        } else if (source[Symbol.asyncIterator] || source[Symbol.iterator]) {
          yield * source
        } else {
          throw errCode(new Error('Content was invalid'), 'ERR_INVALID_CONTENT')
        }
      }())

      /**
       * @type {Chunker}
       */
      let chunker

      if (typeof options.chunker === 'function') {
        chunker = options.chunker
      } else if (options.chunker === 'rabin') {
        chunker = require('../chunker/rabin')
      } else {
        chunker = require('../chunker/fixed-size')
      }

      /**
       * @type {ChunkValidator}
       */
      let chunkValidator

      if (typeof options.chunkValidator === 'function') {
        chunkValidator = options.chunkValidator
      } else {
        chunkValidator = require('./validate-chunks')
      }

      /** @type {File} */
      const file = {
        path: entry.path,
        mtime: entry.mtime,
        mode: entry.mode,
        content: chunker(chunkValidator(content, options), options)
      }

      yield () => fileBuilder(file, block, options)
    } else if (entry.path) {
      /** @type {Directory} */
      const dir = {
        path: entry.path,
        mtime: entry.mtime,
        mode: entry.mode
      }

      yield () => dirBuilder(dir, block, options)
    } else {
      throw new Error('Import candidate must have content or path or both')
    }
  }
}

module.exports = dagBuilder
