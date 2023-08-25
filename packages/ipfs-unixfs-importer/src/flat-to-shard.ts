import { DirFlat } from './dir-flat.js'
import DirSharded, { type DirShardedOptions } from './dir-sharded.js'
import type { Dir } from './dir.js'

export async function flatToShard (child: Dir | null, dir: Dir, threshold: number, options: DirShardedOptions): Promise<DirSharded> {
  let newDir = dir as DirSharded

  if (dir instanceof DirFlat && dir.estimateNodeSize() > threshold) {
    newDir = await convertToShard(dir, options)
  }

  const parent = newDir.parent

  if (parent != null) {
    if (newDir !== dir) {
      if (child != null) {
        child.parent = newDir
      }

      if (newDir.parentKey == null) {
        throw new Error('No parent key found')
      }

      await parent.put(newDir.parentKey, newDir)
    }

    return flatToShard(newDir, parent, threshold, options)
  }

  return newDir
}

async function convertToShard (oldDir: DirFlat, options: DirShardedOptions): Promise<DirSharded> {
  const newDir = new DirSharded({
    root: oldDir.root,
    dir: true,
    parent: oldDir.parent,
    parentKey: oldDir.parentKey,
    path: oldDir.path,
    dirty: oldDir.dirty,
    flat: false,
    mtime: oldDir.mtime,
    mode: oldDir.mode
  }, options)

  for await (const { key, child } of oldDir.eachChildSeries()) {
    await newDir.put(key, child)
  }

  return newDir
}
