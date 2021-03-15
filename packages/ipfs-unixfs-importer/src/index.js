'use strict'

const parallelBatch = require('it-parallel-batch')
const defaultOptions = require('./options')

/**
 * @typedef {import('./types').BlockAPI} BlockAPI
 * @typedef {import('./types').ImportCandidate} ImportCandidate
 * @typedef {import('./types').UserImporterOptions} UserImporterOptions
 * @typedef {import('./types').ImporterOptions} ImporterOptions
 * @typedef {import('./types').Directory} Directory
 * @typedef {import('./types').File} File
 * @typedef {import('./types').ImportResult} ImportResult
 */

/**
 * @param {AsyncIterable<ImportCandidate> | Iterable<ImportCandidate>} source
 * @param {BlockAPI} block
 * @param {UserImporterOptions} options
 */
async function * importer (source, block, options = {}) {
  const opts = defaultOptions(options)

  let dagBuilder

  if (typeof options.dagBuilder === 'function') {
    dagBuilder = options.dagBuilder
  } else {
    dagBuilder = require('./dag-builder')
  }

  let treeBuilder

  if (typeof options.treeBuilder === 'function') {
    treeBuilder = options.treeBuilder
  } else {
    treeBuilder = require('./tree-builder')
  }

  for await (const entry of treeBuilder(parallelBatch(dagBuilder(source, block, opts), opts.fileImportConcurrency), block, opts)) {
    yield {
      cid: entry.cid,
      path: entry.path,
      unixfs: entry.unixfs,
      size: entry.size
    }
  }
}

module.exports = {
  importer
}
