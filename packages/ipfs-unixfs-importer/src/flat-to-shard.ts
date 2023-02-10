import DirSharded from './dir-sharded.js'
import { DirFlat } from './dir-flat.js'
import type { Dir } from './dir.js'
import type { ImporterOptions } from './index.js'

export async function flatToShard (child: Dir | null, dir: Dir, threshold: number, options: ImporterOptions): Promise<DirSharded> {
  let newDir = dir

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

    return await flatToShard(newDir, parent, threshold, options)
  }

  // @ts-expect-error
  return newDir
}

async function convertToShard (oldDir: DirFlat, options: ImporterOptions): Promise<DirSharded> {
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
