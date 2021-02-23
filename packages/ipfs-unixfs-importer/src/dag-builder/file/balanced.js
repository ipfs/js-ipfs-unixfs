'use strict'

const batch = require('it-batch')

/**
 * @typedef {import('../../types').FileDAGBuilder} FileDAGBuilder
 */

/**
 * @type {FileDAGBuilder}
 */
function balanced (source, reduce, options) {
  return reduceToParents(source, reduce, options)
}

/**
 * @type {FileDAGBuilder}
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
