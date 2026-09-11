import { murmur3128 } from '@multiformats/murmur3'
import { createHAMT } from 'hamt-sharding'
import toBuffer from 'it-to-buffer'
import { CID } from 'multiformats/cid'
import { NotFoundError, NotUnixFSError } from '../errors.ts'
import { findShardCid } from './utils/find-cid-in-shard.ts'
import { unixFsStream, isValidUnixFSDirectoryMetadata, isValidUnixFSHAMTMetadata, isValidLink, isValidUnixFSFile, isValidUnixFSRaw, isValidUnixFSSymlink } from './utils/unixfs-stream.ts'
import type { WalkPathOptions, ReadableStorage } from '../index.ts'
import type { ResolveResult } from './index.ts'
import type { Link, UnixFSEntity, UnixFSHAMTMetadata } from './utils/unixfs-stream.ts'

function * findDirectoryEntry (generator: Iterable<UnixFSEntity>, path: string[], root: CID): Generator<ResolveResult> {
  for (const link of generator) {
    if (!isValidLink(link)) {
      throw new NotUnixFSError('Invalid link')
    }

    if (link.name === path[0]) {
      yield {
        cid: link.hash,
        name: path[0],
        rest: path.slice(1)
      }

      return
    }
  }

  throw new NotFoundError(`No link "${path[0]}" found under ${root}`)
}

// FIXME: this is copy/pasted from ipfs-unixfs-importer/src/options.js
const hashFn = async function (buf: Uint8Array): Promise<Uint8Array> {
  return (await murmur3128.encode(buf))
    // Murmur3 outputs 128 bit but, accidentally, IPFS Go's
    // implementation only uses the first 64, so we must do the same
    // for parity..
    .slice(0, 8)
    // Invert buffer because that's how Go impl does it
    .reverse()
}

async function * findHAMTEntry (meta: UnixFSHAMTMetadata, generator: Iterable<UnixFSEntity>, path: string[], root: CID, blockstore: ReadableStorage, options?: WalkPathOptions): AsyncGenerator<ResolveResult> {
  const rootBucket = createHAMT<boolean>({
    hashFn,
    bits: Math.log2(Number(meta.fanOut))
  })

  const context = {
    rootBucket,
    hamtDepth: 1,
    lastBucket: rootBucket
  }

  for await (const result of findShardCid(meta, generator, path[0], path.slice(1), blockstore, context, options)) {
    yield result

    if (result.name === path[0]) {
      return
    }
  }

  throw new NotFoundError(`No link "${path[0]}" found under ${root}`)
}

export async function * dagPbResolver (root: CID, path: string[], blockstore: ReadableStorage, options?: WalkPathOptions): AsyncGenerator<ResolveResult> {
  const block = await toBuffer(blockstore.get(root, options))
  const links: Link[] = []
  const generator = unixFsStream(block)
  const { value } = generator.next()
  let isHAMT = false
  let isDirectory = false

  if (value != null) {
    isDirectory = isValidUnixFSDirectoryMetadata(value)
    isHAMT = isValidUnixFSHAMTMetadata(value)

    if (isValidUnixFSFile(value) || isValidUnixFSRaw(value) || isValidUnixFSSymlink(value)) {
      yield {
        cid: root,
        name: path[0],
        rest: path.slice(1)
      }

      return
    }

    // new-school data-first - we can return early
    if (isDirectory || (isHAMT && options?.translateHAMTPath === false)) {
      yield * findDirectoryEntry(generator, path, root)
      return
    }

    // new-school data-first - we can return early
    if (isHAMT) {
      yield * findHAMTEntry(value, generator, path, root, blockstore, options)
      return
    }

    if (!isValidLink(value)) {
      throw new NotUnixFSError('Did not read Link or Data from dag-pb block')
    }

    // legacy links-first, collect all the links before we can use them
    links.push(value)

    for (const link of generator) {
      isDirectory = isValidUnixFSDirectoryMetadata(link)
      isHAMT = isValidUnixFSHAMTMetadata(link)

      // reached data entry, examine links
      if (isDirectory || (isHAMT && options?.translateHAMTPath === false)) {
        yield * findDirectoryEntry(links, path, root)
        return
      }

      // reached data entry, examine links
      if (isValidUnixFSHAMTMetadata(link)) {
        yield * findHAMTEntry(link, links, path, root, blockstore, options)
        return
      }

      if (!isValidLink(link)) {
        throw new NotUnixFSError('Did not read Link or Data from dag-pb block')
      }

      // old-school links-first, collect all the links
      links.push(link)
    }
  }

  throw new NotFoundError(`No link "${path[0]}" found under ${root}`)
}
