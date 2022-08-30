import parallelBatch from 'it-parallel-batch'
import defaultOptions from './options.js'
import dagBuilderFn from './dag-builder/index.js'
import treeBuilderFn from './tree-builder.js'

/**
 * @typedef {import('interface-blockstore').Blockstore} Blockstore
 * @typedef {import('./types').ImportCandidate} ImportCandidate
 * @typedef {import('./types').UserImporterOptions} UserImporterOptions
 * @typedef {import('./types').ImporterOptions} ImporterOptions
 * @typedef {import('./types').Directory} Directory
 * @typedef {import('./types').File} File
 * @typedef {import('./types').ImportResult} ImportResult
 *
 * @typedef {import('./types').Chunker} Chunker
 * @typedef {import('./types').DAGBuilder} DAGBuilder
 * @typedef {import('./types').TreeBuilder} TreeBuilder
 * @typedef {import('./types').BufferImporter} BufferImporter
 * @typedef {import('./types').ChunkValidator} ChunkValidator
 * @typedef {import('./types').Reducer} Reducer
 * @typedef {import('./types').ProgressHandler} ProgressHandler
 */

/**
 * @param {AsyncIterable<ImportCandidate> | Iterable<ImportCandidate> | ImportCandidate} source
 * @param {Blockstore} blockstore
 * @param {UserImporterOptions} options
 * @returns {AsyncGenerator<ImportResult, void, unknown>}
 */
export async function * importer (source, blockstore, options = {}) {
  const opts = defaultOptions(options)

  let dagBuilder

  if (typeof options.dagBuilder === 'function') {
    dagBuilder = options.dagBuilder
  } else {
    dagBuilder = dagBuilderFn
  }

  let treeBuilder

  if (typeof options.treeBuilder === 'function') {
    treeBuilder = options.treeBuilder
  } else {
    treeBuilder = treeBuilderFn
  }

  /** @type {AsyncIterable<ImportCandidate> | Iterable<ImportCandidate>} */
  let candidates

  if (Symbol.asyncIterator in source || Symbol.iterator in source) {
    // @ts-ignore
    candidates = source
  } else {
    // @ts-ignore
    candidates = [source]
  }

  for await (const entry of treeBuilder(parallelBatch(dagBuilder(candidates, blockstore, opts), opts.fileImportConcurrency), blockstore, opts)) {
    yield {
      cid: entry.cid,
      path: entry.path,
      unixfs: entry.unixfs,
      size: entry.size
    }
  }
}
