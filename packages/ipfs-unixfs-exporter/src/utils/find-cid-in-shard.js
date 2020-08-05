'use strict'

const Bucket = require('hamt-sharding/src/bucket')
const multihashing = require('multihashing-async')
const uint8ArrayFromString = require('uint8arrays/from-string')

// FIXME: this is copy/pasted from ipfs-unixfs-importer/src/dir-sharded.js
const hashFn = async function (value) {
  const buf = uint8ArrayFromString(value)
  const hash = await multihashing(buf, 'murmur3-128')

  // Multihashing inserts preamble of 2 bytes. Remove it.
  // Also, murmur3 outputs 128 bit but, accidently, IPFS Go's
  // implementation only uses the first 64, so we must do the same
  // for parity..
  const justHash = hash.slice(2, 10)
  const length = justHash.length
  const result = new Uint8Array(length)
  // TODO: invert buffer because that's how Go impl does it
  for (let i = 0; i < length; i++) {
    result[length - i - 1] = justHash[i]
  }

  return result
}
hashFn.code = 0x22 // TODO: get this from multihashing-async?

const addLinksToHamtBucket = (links, bucket, rootBucket) => {
  return Promise.all(
    links.map(link => {
      if (link.Name.length === 2) {
        const pos = parseInt(link.Name, 16)

        return bucket._putObjectAt(pos, new Bucket({
          hashFn
        }, bucket, pos))
      }

      return rootBucket.put(link.Name.substring(2), true)
    })
  )
}

const toPrefix = (position) => {
  return position
    .toString('16')
    .toUpperCase()
    .padStart(2, '0')
    .substring(0, 2)
}

const toBucketPath = (position) => {
  let bucket = position.bucket
  const path = []

  while (bucket._parent) {
    path.push(bucket)

    bucket = bucket._parent
  }

  path.push(bucket)

  return path.reverse()
}

const findShardCid = async (node, name, ipld, context, options) => {
  if (!context) {
    context = {
      rootBucket: new Bucket({
        hashFn
      }),
      hamtDepth: 1
    }

    context.lastBucket = context.rootBucket
  }

  await addLinksToHamtBucket(node.Links, context.lastBucket, context.rootBucket)

  const position = await context.rootBucket._findNewBucketAndPos(name)
  let prefix = toPrefix(position.pos)
  const bucketPath = toBucketPath(position)

  if (bucketPath.length > (context.hamtDepth)) {
    context.lastBucket = bucketPath[context.hamtDepth]

    prefix = toPrefix(context.lastBucket._posAtParent)
  }

  const link = node.Links.find(link => {
    const entryPrefix = link.Name.substring(0, 2)
    const entryName = link.Name.substring(2)

    if (entryPrefix !== prefix) {
      // not the entry or subshard we're looking for
      return
    }

    if (entryName && entryName !== name) {
      // not the entry we're looking for
      return
    }

    return true
  })

  if (!link) {
    return null
  }

  if (link.Name.substring(2) === name) {
    return link.Hash
  }

  context.hamtDepth++

  node = await ipld.get(link.Hash, options)

  return findShardCid(node, name, ipld, context, options)
}

module.exports = findShardCid
