import * as dagCbor from '@ipld/dag-cbor'
import * as dagJson from '@ipld/dag-json'
import * as dagPb from '@ipld/dag-pb'
import last from 'it-last'
import { CID } from 'multiformats'
import * as json from 'multiformats/codecs/json'
import * as raw from 'multiformats/codecs/raw'
import { identity } from 'multiformats/hashes/identity'
import { CODEC_CBOR } from '../constants.ts'
import { InvalidParametersError, NoResolverError, NotFoundError } from '../errors.js'
import { walkPath } from '../index.js'
import { dagCborResolver } from './dag-cbor.ts'
import { dagJsonResolver } from './dag-json.ts'
import { identityResolver } from './identity.ts'
import { jsonResolver } from './json.ts'
import { rawResolver } from './raw.ts'
import { dagPbResolver } from './unixfs-v1/index.ts'
import type { ExporterOptions, ReadableStorage, Resolver, UnixFSDirectory, UnixFSEntry, UnixFSRecursiveEntry } from '../index.js'

const resolvers: Record<number, Resolver> = {
  [dagPb.code]: dagPbResolver,
  [raw.code]: rawResolver,
  [dagCbor.code]: dagCborResolver,
  [CODEC_CBOR]: dagCborResolver,
  [dagJson.code]: dagJsonResolver,
  [identity.code]: identityResolver,
  [json.code]: jsonResolver
}

/**
 * Uses the given blockstore instance to fetch an IPFS node by a CID or path.
 *
 * Returns a {@link Promise} which resolves to a {@link UnixFSEntry}.
 *
 * @example
 *
 * ```typescript
 * import { exporter } from 'ipfs-unixfs-exporter'
 * import { CID } from 'multiformats/cid'
 *
 * const cid = CID.parse('QmFoo')
 *
 * const entry = await exporter(cid, blockstore, {
 *   signal: AbortSignal.timeout(50000)
 * })
 *
 * if (entry.type === 'file') {
 *   for await (const chunk of entry.content()) {
 *     // chunk is a Uint8Array
 *   }
 * }
 * ```
 */
export async function exporter (path: string | CID, blockstore: ReadableStorage, options: ExporterOptions = {}): Promise<UnixFSEntry> {
  let cid: CID
  let name: string

  if (path instanceof String || typeof path === 'string') {
    const entry = await last(walkPath(path, blockstore, options))

    if (entry == null) {
      throw new NotFoundError(`Could not walk path to ${path}`)
    }

    cid = entry.cid
    name = entry.name
    path = entry.path
  } else if (CID.asCID(path) === path || path instanceof CID) {
    cid = path
    name = path = cid.toString()
  } else {
    throw new InvalidParametersError('Path must be string or CID')
  }

  const resolver = resolvers[cid.code]

  if (resolver == null) {
    throw new NoResolverError(`No resolver for code ${cid.code}`)
  }

  return resolver(cid, name, path, blockstore, options)
}

/**
 * Returns an async iterator that yields all entries beneath a given CID or IPFS
 * path, as well as the containing directory.
 *
 * @example
 *
 * ```typescript
 * import { recursive } from 'ipfs-unixfs-exporter'
 *
 * const entries = []
 *
 * for await (const child of recursive(CID.parse('Qmfoo'), blockstore)) {
 *   entries.push(entry)
 * }
 *
 * // entries contains all children of the `Qmfoo` directory and it's children
 * ```
 */
export async function * recursive (path: string | CID, blockstore: ReadableStorage, options: ExporterOptions = {}): AsyncGenerator<UnixFSRecursiveEntry, void, any> {
  const node = await exporter(path, blockstore, options)

  if (node == null) {
    return
  }

  yield {
    cid: node.cid,
    name: node.name,
    path: node.path,
    depth: 0
  }

  if (node.type === 'directory') {
    for await (const child of recurse(node, 0, `${path}`, options)) {
      yield child
    }
  }

  async function * recurse (node: UnixFSDirectory, depth: number, path: string, options: ExporterOptions): AsyncGenerator<UnixFSRecursiveEntry, void, any> {
    depth++

    for await (const entry of node.entries(options)) {
      const entryPath = `${path}/${entry.name}`

      yield {
        ...entry,
        depth,
        path: entryPath
      }

      const file = await exporter(entry.cid, blockstore, options)

      if (file.type === 'directory') {
        yield * recurse(file, depth, entryPath, options)
      }
    }
  }
}
