import toBuffer from 'it-to-buffer'
import * as json from 'multiformats/codecs/json'
import { resolveObjectPath } from './utils/resolve-object-path.ts'
import type { ResolveResult } from './index.ts'
import type { ReadableStorage, WalkPathOptions } from '../index.ts'
import type { CID } from 'multiformats/cid'

export async function * jsonResolver (root: CID, path: string[], blockstore: ReadableStorage, options?: WalkPathOptions): AsyncGenerator<ResolveResult> {
  const block = await toBuffer(blockstore.get(root, options))
  const object = json.decode<any>(block)

  // will throw if the path cannot be resolved in the current object
  const result = resolveObjectPath(object, path)

  yield {
    cid: root,
    name: result.path,
    rest: result.rest
  }
}
