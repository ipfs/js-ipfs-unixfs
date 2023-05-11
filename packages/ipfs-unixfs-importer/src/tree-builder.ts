import { DirFlat } from './dir-flat.js'
import { Dir } from './dir.js'
import { flatToShard } from './flat-to-shard.js'
import { toPathComponents } from './utils/to-path-components.js'
import type { ImportResult, InProgressImportResult, TreeBuilder, WritableStorage } from './index.js'
import type { PersistOptions } from './utils/persist.js'

export interface AddToTreeOptions extends PersistOptions {
  shardSplitThresholdBytes: number
}

async function addToTree (elem: InProgressImportResult, tree: Dir, options: AddToTreeOptions): Promise<Dir> {
  const pathElems = toPathComponents(elem.path ?? '')
  const lastIndex = pathElems.length - 1
  let parent = tree
  let currentPath = ''

  for (let i = 0; i < pathElems.length; i++) {
    const pathElem = pathElems[i]

    currentPath += `${currentPath !== '' ? '/' : ''}${pathElem}`

    const last = (i === lastIndex)
    parent.dirty = true
    parent.cid = undefined
    parent.size = undefined

    if (last) {
      await parent.put(pathElem, elem)
      tree = await flatToShard(null, parent, options.shardSplitThresholdBytes, options)
    } else {
      let dir = await parent.get(pathElem)

      if ((dir == null) || !(dir instanceof Dir)) {
        dir = new DirFlat({
          root: false,
          dir: true,
          parent,
          parentKey: pathElem,
          path: currentPath,
          dirty: true,
          flat: true,
          mtime: dir?.unixfs?.mtime,
          mode: dir?.unixfs?.mode
        }, options)
      }

      await parent.put(pathElem, dir)

      parent = dir
    }
  }

  return tree
}

async function * flushAndYield (tree: Dir | InProgressImportResult, blockstore: WritableStorage): AsyncGenerator<ImportResult> {
  if (!(tree instanceof Dir)) {
    if (tree.unixfs?.isDirectory() === true) {
      yield tree
    }

    return
  }

  yield * tree.flush(blockstore)
}

export interface TreeBuilderOptions extends AddToTreeOptions {
  wrapWithDirectory: boolean
}

export function defaultTreeBuilder (options: TreeBuilderOptions): TreeBuilder {
  return async function * treeBuilder (source, block) {
    let tree: Dir = new DirFlat({
      root: true,
      dir: true,
      path: '',
      dirty: true,
      flat: true
    }, options)

    let rootDir: string | undefined
    let singleRoot = false

    for await (const entry of source) {
      if (entry == null) {
        continue
      }

      // if all paths are from the same root directory, we should
      // wrap them all in that root directory
      const dir = `${entry.originalPath ?? ''}`.split('/')[0]

      if (dir != null && dir !== '') {
        if (rootDir == null) {
          rootDir = dir
          singleRoot = true
        } else if (rootDir !== dir) {
          singleRoot = false
        }
      }

      tree = await addToTree(entry, tree, options)

      if (entry.unixfs == null || !entry.unixfs.isDirectory()) {
        yield entry
      }
    }

    if (options.wrapWithDirectory || (singleRoot && tree.childCount() > 1)) {
      yield * flushAndYield(tree, block)
    } else {
      for await (const unwrapped of tree.eachChildSeries()) {
        if (unwrapped == null) {
          continue
        }

        yield * flushAndYield(unwrapped.child, block)
      }
    }
  }
}
