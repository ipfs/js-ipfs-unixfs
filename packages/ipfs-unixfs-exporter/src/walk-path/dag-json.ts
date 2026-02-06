import * as dagJson from '@ipld/dag-json'
import toBuffer from 'it-to-buffer'
import { CID } from 'multiformats/cid'
import { isCID } from './utils/is-cid.ts'
import { resolveObjectPath } from './utils/resolve-object-path.ts'
import type { WalkPathOptions, ReadableStorage } from '../index.ts'
import type { ResolveResult } from './index.ts'

export async function * dagJsonResolver (root: CID, path: string[], blockstore: ReadableStorage, options?: WalkPathOptions): AsyncGenerator<ResolveResult> {
  const block = await toBuffer(blockstore.get(root, options))
  const object = dagJson.decode<any>(block)

  // ensures the path either terminates in the current object, or there is an
  // onward CID, otherwise will throw BadPathError
  const result = resolveObjectPath(object, path)

  // if the whole of the requested path is in the current node, yield the root
  // CID, otherwise yield the onward CID
  yield {
    cid: isCID(result.value) ? result.value : root,
    name: result.path,
    rest: result.rest
  }
}
