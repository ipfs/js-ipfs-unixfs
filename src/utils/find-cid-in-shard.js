'use strict'

const Bucket = require('hamt-sharding/src/bucket')
const DirSharded = require('ipfs-unixfs-importer/src/dir-sharded')

const addLinksToHamtBucket = (links, bucket, rootBucket) => {
  return Promise.all(
    links.map(link => {
      if (link.Name.length === 2) {
        const pos = parseInt(link.Name, 16)

        return bucket._putObjectAt(pos, new Bucket({
          hashFn: DirSharded.hashFn
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

const findShardCid = async (node, name, ipld, context) => {
  if (!context) {
    context = {
      rootBucket: new Bucket({
        hashFn: DirSharded.hashFn
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

  node = await ipld.get(link.Hash)

  return findShardCid(node, name, ipld, context)
}

module.exports = findShardCid
