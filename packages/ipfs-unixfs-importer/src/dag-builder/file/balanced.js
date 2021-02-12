'use strict'

const batch = require('it-batch')

/**
 * @typedef {import('cids')} CID
 * @typedef {import('../..').ImporterOptions} ImporterOptions
 * @typedef {import('../..').ImportResult} ImportResult
 */

/**
 * @type {import('.').DAGBuilder}
 */
async function * balanced (source, reduce, options) {
  yield await reduceToParents(source, reduce, options)
}

/**
 * @param {AsyncIterable<ImportResult> | ImportResult[]} source
 * @param {import('.').Reducer} reduce
 * @param {ImporterOptions} options
 * @returns {Promise<ImportResult>}
 */
async function reduceToParents (source, reduce, options) {
  const roots = []

  for await (const chunked of batch(source, options.maxChildrenPerNode)) {
    roots.push(await reduce(chunked))
  }

  if (roots.length > 1) {
    return reduceToParents(roots, reduce, options)
  }

  return roots[0]
}

module.exports = balanced
