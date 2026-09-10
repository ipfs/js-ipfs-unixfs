import { murmur3128 } from '@multiformats/murmur3'
import { Bucket } from 'hamt-sharding'
import toBuffer from 'it-to-buffer'
import { NotUnixFSError } from '../../errors.ts'
import { isValidLink, isValidUnixFSHAMTMetadata, unixFsStream } from './unixfs-stream.ts'
import type { Link, UnixFSEntity, UnixFSHAMTMetadata } from './unixfs-stream.ts'
import type { ReadableStorage, WalkPathOptions } from '../../index.ts'
import type { ResolveResult } from '../index.ts'
import type { BucketPosition } from 'hamt-sharding'

interface ShardTraversalContext {
  hamtDepth: number
  rootBucket: Bucket<boolean>
  lastBucket: Bucket<boolean>
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

const addLinksToHamtBucket = async (links: Link[], bucket: Bucket<boolean>, rootBucket: Bucket<boolean>): Promise<void> => {
  const padLength = (bucket.tableSize() - 1).toString(16).length
  await Promise.all(
    links.map(async link => {
      if (link.name.length === padLength) {
        const pos = parseInt(link.name, 16)

        bucket._putObjectAt(pos, new Bucket({
          hash: rootBucket._options.hash,
          bits: rootBucket._options.bits
        }, bucket, pos))
        return
      }

      await rootBucket.put(link.name.substring(padLength), true)
    })
  )
}

const toPrefix = (position: number, padLength: number): string => {
  return position
    .toString(16)
    .toUpperCase()
    .padStart(padLength, '0')
    .substring(0, padLength)
}

const toBucketPath = (position: BucketPosition<boolean>): Array<Bucket<boolean>> => {
  let bucket = position.bucket
  const path = []

  while (bucket._parent != null) {
    path.push(bucket)

    bucket = bucket._parent
  }

  path.push(bucket)

  return path.reverse()
}

export async function * findShardCid (meta: UnixFSHAMTMetadata, generator: Iterable<UnixFSEntity>, name: string, rest: string[], blockstore: ReadableStorage, context: ShardTraversalContext, options?: WalkPathOptions): AsyncGenerator<ResolveResult> {
  const padLength = (context.lastBucket.tableSize() - 1).toString(16).length
  let links: Link[] = []

  for (const link of generator) {
    if (!isValidLink(link)) {
      throw new NotUnixFSError('Invalid link')
    }

    links.push(link)

    if (link.name.length === padLength) {
      // sub-shard
      const pos = parseInt(link.name, 16)

      context.lastBucket._putObjectAt(pos, new Bucket({
        hash: context.lastBucket._options.hash,
        bits: context.lastBucket._options.bits
      }, context.lastBucket, pos))
    }

    if (link.name.substring(padLength) === name) {
      // can abort early
      yield {
        cid: link.hash,
        name,
        rest
      }

      return
    }

    await context.rootBucket.put(link.name.substring(padLength), true)
  }

  const position = await context.rootBucket._findNewBucketAndPos(name)
  let prefix = toPrefix(position.pos, padLength)
  const bucketPath = toBucketPath(position)

  if (bucketPath.length > context.hamtDepth) {
    context.lastBucket = bucketPath[context.hamtDepth]

    prefix = toPrefix(context.lastBucket._posAtParent, padLength)
  }

  const link = links.find(link => {
    if (link.name == null) {
      return false
    }

    if (link.name === prefix) {
      return true
    }

    return false
  })

  if (link == null) {
    return
  }

  context.hamtDepth++

  const block = await toBuffer(blockstore.get(link.hash, options))

  if (options?.yieldSubShards === true) {
    yield {
      cid: link.hash,
      name: link.name,
      rest: [name, ...rest]
    }
  }

  const gen = unixFsStream(block)
  const { value } = gen.next()
  links = []

  if (value != null) {
    // new-school data-first - we can return early
    if (isValidUnixFSHAMTMetadata(value)) {
      yield * findShardCid(value, gen, name, rest, blockstore, context, options)
      return
    }

    if (!isValidLink(value)) {
      throw new NotUnixFSError('Did not read Link or Data from dag-pb block')
    }

    // legacy links-first, collect all the links before we can use them
    links.push(value)

    for (const link of gen) {
      // reached data entry, examine links
      if (isValidUnixFSHAMTMetadata(link)) {
        yield * findShardCid(link, links, name, rest, blockstore, context, options)
        return
      }

      if (!isValidLink(link)) {
        throw new NotUnixFSError('Did not read Link or Data from dag-pb block')
      }

      // old-school links-first, collect all the links
      links.push(link)
    }
  }
}
