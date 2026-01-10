import { BadPathError } from '../index.js'
import type { WalkPathOptions, ReadableStorage } from '../index.js'
import type { ResolveResult } from './index.ts'
import type { CID } from 'multiformats/cid'

// eslint-disable-next-line require-yield
export async function * identityResolver (root: CID, path: string[], blockstore: ReadableStorage, options?: WalkPathOptions): AsyncGenerator<ResolveResult> {
  if (path.length === 0) {
    return
  }

  throw new BadPathError(`Cannot load path /${path.join('/')} from identity block`)
}
