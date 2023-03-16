
import { Bucket, BucketPosition, createHAMT } from 'hamt-sharding'
import { decode, PBLink, PBNode } from '@ipld/dag-pb'
import { murmur3128 } from '@multiformats/murmur3'
import type { ExporterOptions, ShardTraversalContext, ReadableStorage } from '../index.js'
import type { CID } from 'multiformats/cid'

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

const addLinksToHamtBucket = async (links: PBLink[], bucket: Bucket<boolean>, rootBucket: Bucket<boolean>): Promise<void> => {
  await Promise.all(
    links.map(async link => {
      if (link.Name == null) {
        // TODO(@rvagg): what do? this is technically possible
        throw new Error('Unexpected Link without a Name')
      }
      if (link.Name.length === 2) {
        const pos = parseInt(link.Name, 16)

        bucket._putObjectAt(pos, new Bucket({
          hash: rootBucket._options.hash,
          bits: rootBucket._options.bits
        }, bucket, pos))
        return
      }

      await rootBucket.put(link.Name.substring(2), true)
    })
  )
}

const toPrefix = (position: number): string => {
  return position
    .toString(16)
    .toUpperCase()
    .padStart(2, '0')
    .substring(0, 2)
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

const findShardCid = async (node: PBNode, name: string, blockstore: ReadableStorage, context?: ShardTraversalContext, options?: ExporterOptions): Promise<CID | undefined> => {
  if (context == null) {
    const rootBucket = createHAMT<boolean>({
      hashFn
    })

    context = {
      rootBucket,
      hamtDepth: 1,
      lastBucket: rootBucket
    }
  }

  await addLinksToHamtBucket(node.Links, context.lastBucket, context.rootBucket)

  const position = await context.rootBucket._findNewBucketAndPos(name)
  let prefix = toPrefix(position.pos)
  const bucketPath = toBucketPath(position)

  if (bucketPath.length > context.hamtDepth) {
    context.lastBucket = bucketPath[context.hamtDepth]

    prefix = toPrefix(context.lastBucket._posAtParent)
  }

  const link = node.Links.find(link => {
    if (link.Name == null) {
      return false
    }

    const entryPrefix = link.Name.substring(0, 2)
    const entryName = link.Name.substring(2)

    if (entryPrefix !== prefix) {
      // not the entry or subshard we're looking for
      return false
    }

    if (entryName !== '' && entryName !== name) {
      // not the entry we're looking for
      return false
    }

    return true
  })

  if (link == null) {
    return
  }

  if (link.Name != null && link.Name.substring(2) === name) {
    return link.Hash
  }

  context.hamtDepth++

  const block = await blockstore.get(link.Hash, options)
  node = decode(block)

  return await findShardCid(node, name, blockstore, context, options)
}

export default findShardCid
