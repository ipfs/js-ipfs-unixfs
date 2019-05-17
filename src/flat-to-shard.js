'use strict'

const DirSharded = require('./dir-sharded')

module.exports = async function flatToShard (child, dir, threshold, options) {
  let newDir = dir

  if (dir.flat && dir.directChildrenCount() >= threshold) {
    newDir = await convertToShard(dir, options)
  }

  const parent = newDir.parent

  if (parent) {
    if (newDir !== dir) {
      if (child) {
        child.parent = newDir
      }

      await parent.put(newDir.parentKey, newDir)
    }

    if (parent) {
      return flatToShard(newDir, parent, threshold, options)
    }
  }

  return newDir
}

async function convertToShard (oldDir, options) {
  const newDir = new DirSharded({
    root: oldDir.root,
    dir: true,
    parent: oldDir.parent,
    parentKey: oldDir.parentKey,
    path: oldDir.path,
    dirty: oldDir.dirty,
    flat: false
  }, options)

  for await (const { key, child } of oldDir.eachChildSeries()) {
    await newDir.put(key, child)
  }

  return newDir
}
