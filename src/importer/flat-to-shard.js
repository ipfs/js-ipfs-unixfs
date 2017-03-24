'use strict'

const waterfall = require('async/waterfall')
const DirSharded = require('./dir-sharded')

module.exports = flatToShard

function flatToShard (child, dir, threshold, callback) {
  maybeFlatToShardOne(dir, threshold, (err, newDir) => {
    if (err) {
      callback(err)
      return // early
    }

    const parent = newDir.parent
    if (parent) {
      waterfall([
        (callback) => {
          if (newDir !== dir) {
            if (child) {
              child.parent = newDir
            }
            parent.put(newDir.parentKey, newDir, callback)
          } else {
            callback()
          }
        },
        (callback) => {
          if (parent) {
            flatToShard(newDir, parent, threshold, callback)
          } else {
            callback(null, newDir)
          }
        }
      ], callback)
    } else {
      // no parent, we're done climbing tree
      callback(null, newDir)
    }
  })
}

function maybeFlatToShardOne (dir, threshold, callback) {
  if (dir.flat && dir.directChildrenCount() >= threshold) {
    definitelyShardOne(dir, callback)
  } else {
    callback(null, dir)
  }
}

function definitelyShardOne (oldDir, callback) {
  const newDir = DirSharded({
    root: oldDir.root,
    dir: true,
    parent: oldDir.parent,
    parentKey: oldDir.parentKey,
    path: oldDir.path,
    dirty: oldDir.dirty,
    flat: false
  })

  oldDir.eachChildSeries(
    (key, value, callback) => {
      newDir.put(key, value, callback)
    },
    (err) => {
      if (err) {
        callback(err)
      } else {
        callback(err, newDir)
      }
    }
  )
}
