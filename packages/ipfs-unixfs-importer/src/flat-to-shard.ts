import { DirFlat } from './dir-flat.ts'
import DirSharded from './dir-sharded.ts'
import type { Dir } from './dir.ts'

export async function flatToShard (child: Dir | null, dir: Dir): Promise<DirSharded> {
  let newDir = dir as DirSharded

  if (dir instanceof DirFlat && (await dir.estimateNodeSize()) > dir.options.shardSplitThresholdBytes) {
    newDir = await convertToShard(dir)
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

    return flatToShard(newDir, parent)
  }

  return newDir
}

async function convertToShard (oldDir: DirFlat): Promise<DirSharded> {
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
  }, oldDir.options)

  for (const { key, child } of oldDir.eachChildSeries()) {
    await newDir.put(key, child)
  }

  return newDir
}
