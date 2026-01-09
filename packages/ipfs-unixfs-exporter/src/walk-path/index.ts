import * as dagCbor from '@ipld/dag-cbor'
import * as dagJson from '@ipld/dag-json'
import * as dagPb from '@ipld/dag-pb'
import { CID } from 'multiformats/cid'
import * as json from 'multiformats/codecs/json'
import * as raw from 'multiformats/codecs/raw'
import { identity } from 'multiformats/hashes/identity'
import { CODEC_CBOR } from '../constants.ts'
import { NoResolverError, NotFoundError } from '../errors.ts'
import { dagCborResolver } from './dag-cbor.js'
import { dagJsonResolver } from './dag-json.js'
import { dagPbResolver } from './dag-pb.ts'
import { identityResolver } from './identity.js'
import { jsonResolver } from './json.js'
import { rawResolver } from './raw.js'
import type { ReadableStorage, WalkPathOptions } from '../index.ts'

export interface ResolveResult {
  /**
   * The CID of the node
   */
  cid: CID

  /**
   * The name of the node
   */
  name: string

  /**
   * Any unresolved path segments
   */
  rest: string[]
}

/**
 * A resolver searches the block that the root CID resolves to for one or more
 * resolve results corresponding to the passed path segments, loading new blocks
 * as necessary.
 */
export interface Resolver {
  (root: CID, path: string[], blockstore: ReadableStorage, options?: WalkPathOptions): AsyncGenerator<ResolveResult>
}

export const resolvers: Record<number, Resolver> = {
  [dagPb.code]: dagPbResolver,
  [raw.code]: rawResolver,
  [dagCbor.code]: dagCborResolver,
  [CODEC_CBOR]: dagCborResolver,
  [dagJson.code]: dagJsonResolver,
  [identity.code]: identityResolver,
  [json.code]: jsonResolver
}

export interface PathEntry {
  cid: CID
  name: string
  path: string
  roots: CID[]
  remainder: string[]
}

/**
 * Returns an async iterator that yields entries for all segments in a path
 *
 * @example
 *
 * ```TypeScript
 * import { walkPath } from 'ipfs-unixfs-exporter'
 *
 * const entries = []
 *
 * for await (const entry of walkPath('Qmfoo/foo/bar/baz.txt', blockstore)) {
 *   entries.push(entry)
 * }
 *
 * // entries contains 4x `entry` objects
 * ```
 */
export async function * walkPath (path: string | CID, blockstore: ReadableStorage, options: WalkPathOptions = {}): AsyncGenerator<PathEntry, void, any> {
  path = path.toString()

  // strip "/ipfs/"
  if (path.startsWith('/ipfs/')) {
    path = path.substring(6)
  }

  while (path.endsWith('/')) {
    path = path.substring(0, path.length - 1)
  }

  let [
    root,
    ...rest
  ] = path
    .split(/(?<!\\)\//g) // split on unescaped forward slashes
    .filter(Boolean)

  let cid = CID.parse(root)
  let roots: CID[] = [
    cid
  ]
  let location = `${cid}`

  // yield root path entry
  yield {
    cid,
    name: location,
    path: location,
    roots,
    remainder: rest
  }

  while (rest.length > 0) {
    const resolver = resolvers[cid.code]

    if (resolver == null) {
      throw new NoResolverError(`No resolver for code ${cid.code}`)
    }

    let traversedDeeper = false

    for await (const result of resolver(cid, rest, blockstore, options)) {
      cid = result.cid
      traversedDeeper = !roots[roots.length - 1].equals(cid)
      rest = result.rest

      if (!traversedDeeper) {
        break
      }

      roots = [...roots, result.cid]
      location = `${location}/${result.name}`

      // yield next path entry
      yield {
        cid: result.cid,
        name: result.name,
        path: location,
        roots,
        remainder: result.rest
      }
    }

    // we did not traverse any deeper into the dag, we are finished
    if (!traversedDeeper) {
      break
    }
  }

  // need to throw if we've only done sync work up until this point
  options?.signal?.throwIfAborted()

  if (rest.length !== 0) {
    throw new NotFoundError(`Could not resolve path /${rest.join('/')} under ${path}`)
  }
}
