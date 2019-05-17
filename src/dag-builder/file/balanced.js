'use strict'

const batch = require('async-iterator-batch')

async function * balanced (source, reduce, options) {
  yield await reduceToParents(source, reduce, options)
}

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
