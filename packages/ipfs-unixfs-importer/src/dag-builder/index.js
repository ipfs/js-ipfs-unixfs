'use strict'

const dirBuilder = require('./dir')
const fileBuilder = require('./file')

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
      let source = entry.content

      // wrap in iterator if it is array-like or not an iterator
      if ((!source[Symbol.asyncIterator] && !source[Symbol.iterator]) || source.length !== undefined) {
        source = {
          [Symbol.iterator]: function * () {
            yield entry.content
          }
        }
      }

      let chunker

      if (typeof options.chunker === 'function') {
        chunker = options.chunker
      } else if (options.chunker === 'rabin') {
        chunker = require('../chunker/rabin')
      } else {
        chunker = require('../chunker/fixed-size')
      }

      let chunkValidator

      if (typeof options.chunkValidator === 'function') {
        chunkValidator = options.chunkValidator
      } else {
        chunkValidator = require('./validate-chunks')
      }

      // item is a file
      yield () => fileBuilder(entry, chunker(chunkValidator(source, options), options), block, options)
    } else {
      // item is a directory
      yield () => dirBuilder(entry, block, options)
    }
  }
}

module.exports = dagBuilder
