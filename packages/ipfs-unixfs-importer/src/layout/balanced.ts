import batch from 'it-batch'
import type { FileLayout } from './index.js'
import type { InProgressImportResult } from '../index.js'

const DEFAULT_MAX_CHILDREN_PER_NODE = 174

export interface BalancedOptions {
  maxChildrenPerNode?: number
}

export function balanced (options?: BalancedOptions): FileLayout {
  const maxChildrenPerNode = options?.maxChildrenPerNode ?? DEFAULT_MAX_CHILDREN_PER_NODE

  return async function balancedLayout (source, reduce): Promise<InProgressImportResult> {
    const roots = []

    for await (const chunked of batch(source, maxChildrenPerNode)) {
      roots.push(await reduce(chunked))
    }

    if (roots.length > 1) {
      return balancedLayout(roots, reduce)
    }

    return roots[0]
  }
}
