import { NotFoundError } from '../index.ts'
import type { ReadableStorage, WalkPathOptions } from '../index.ts'
import type { ResolveResult } from './index.ts'
import type { CID } from 'multiformats/cid'

// eslint-disable-next-line require-yield
export async function * rawResolver (root: CID, path: string[], blockstore: ReadableStorage, options?: WalkPathOptions): AsyncGenerator<ResolveResult> {
  if (path.length === 0) {
    return
  }

  throw new NotFoundError(`Cannot load path /${path.join('/')} from raw block`)
}
