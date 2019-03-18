'use strict'

const defer = require('pull-defer')
const pull = require('pull-stream/pull')
const error = require('pull-stream/sources/error')
const values = require('pull-stream/sources/values')
const filter = require('pull-stream/throughs/filter')
const map = require('pull-stream/throughs/map')
const cat = require('pull-cat')
const Bucket = require('hamt-sharding/src/bucket')
const DirSharded = require('ipfs-unixfs-importer/src/importer/dir-sharded')
const waterfall = require('async/waterfall')

// Logic to export a unixfs directory.
module.exports = shardedDirExporter

function shardedDirExporter (cid, node, name, path, pathRest, resolve, dag, parent, depth, options) {
  let dir
  if (!parent || (parent.path !== path)) {
    dir = {
      name: name,
      depth: depth,
      path: path,
      cid,
      size: 0,
      type: 'dir'
    }
  }

  // we are at the max depth so no need to descend into children
  if (options.maxDepth && options.maxDepth <= depth) {
    return values([dir])
  }

  if (!pathRest.length) {
    // return all children

    const streams = [
      pull(
        values(node.links),
        map((link) => {
          // remove the link prefix (2 chars for the bucket index)
          const entryName = link.name.substring(2)
          const entryPath = entryName ? path + '/' + entryName : path

          return {
            depth: entryName ? depth + 1 : depth,
            name: entryName,
            path: entryPath,
            cid: link.cid,
            pathRest: entryName ? pathRest.slice(1) : pathRest,
            parent: dir || parent
          }
        }),
        resolve
      )
    ]

    // place dir before if not specifying subtree
    streams.unshift(values([dir]))

    return cat(streams)
  }

  const deferred = defer.source()
  const targetFile = pathRest[0]

  // recreate our level of the HAMT so we can load only the subshard in pathRest
  waterfall([
    (cb) => {
      if (!options.rootBucket) {
        options.rootBucket = new Bucket({
          hashFn: DirSharded.hashFn
        })
        options.hamtDepth = 1

        return addLinksToHamtBucket(node.links, options.rootBucket, options.rootBucket, cb)
      }

      return addLinksToHamtBucket(node.links, options.lastBucket, options.rootBucket, cb)
    },
    (cb) => findPosition(targetFile, options.rootBucket, cb),
    (position, cb) => {
      let prefix = toPrefix(position.pos)
      const bucketPath = toBucketPath(position)

      if (bucketPath.length > (options.hamtDepth)) {
        options.lastBucket = bucketPath[options.hamtDepth]

        prefix = toPrefix(options.lastBucket._posAtParent)
      }

      const streams = [
        pull(
          values(node.links),
          map((link) => {
            const entryPrefix = link.name.substring(0, 2)
            const entryName = link.name.substring(2)
            const entryPath = entryName ? path + '/' + entryName : path

            if (entryPrefix !== prefix) {
              // not the entry or subshard we're looking for
              return false
            }

            if (entryName && entryName !== targetFile) {
              // not the entry we're looking for
              return false
            }

            if (!entryName) {
              // we are doing to descend into a subshard
              options.hamtDepth++
            } else {
              // we've found the node we are looking for, remove the context
              // so we don't affect further hamt traversals
              delete options.rootBucket
              delete options.lastBucket
              delete options.hamtDepth
            }

            return {
              depth: entryName ? depth + 1 : depth,
              name: entryName,
              path: entryPath,
              cid: link.cid,
              pathRest: entryName ? pathRest.slice(1) : pathRest,
              parent: dir || parent
            }
          }),
          filter(Boolean),
          resolve
        )
      ]

      if (options.fullPath) {
        streams.unshift(values([dir]))
      }

      cb(null, streams)
    }
  ], (err, streams) => {
    if (err) {
      return deferred.resolve(error(err))
    }

    deferred.resolve(cat(streams))
  })

  return deferred
}

const addLinksToHamtBucket = (links, bucket, rootBucket, callback) => {
  Promise.all(
    links.map(link => {
      if (link.name.length === 2) {
        const pos = parseInt(link.name, 16)

        return bucket._putObjectAt(pos, new Bucket({
          hashFn: DirSharded.hashFn
        }, bucket, pos))
      }

      return rootBucket.put(link.name.substring(2), true)
    })
  )
    .then(() => callback(), callback)
}

const toPrefix = (position) => {
  return position
    .toString('16')
    .toUpperCase()
    .padStart(2, '0')
    .substring(0, 2)
}

const findPosition = (file, bucket, cb) => {
  bucket._findNewBucketAndPos(file)
    .then(position => {
      if (!cb) {
        // would have errored in catch block above
        return
      }

      cb(null, position)
    }, cb)
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
