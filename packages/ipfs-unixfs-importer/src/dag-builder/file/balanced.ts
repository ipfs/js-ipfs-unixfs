import batch from 'it-batch'
import type { FileDAGBuilder } from '../../index.js'

export const balanced: FileDAGBuilder = async (source, reduce, options) => {
  return await reduceToParents(source, reduce, options)
}

const reduceToParents: FileDAGBuilder = async (source, reduce, options) => {
  const roots = []

  for await (const chunked of batch(source, options.maxChildrenPerNode)) {
    roots.push(await reduce(chunked))
  }

  if (roots.length > 1) {
    return await reduceToParents(roots, reduce, options)
  }

  return roots[0]
}
