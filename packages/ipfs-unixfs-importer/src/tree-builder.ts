import { DirFlat } from './dir-flat.js'
import { flatToShard } from './flat-to-shard.js'
import { Dir } from './dir.js'
import { toPathComponents } from './utils/to-path-components.js'
import type { ImporterOptions, ImportResult, InProgressImportResult, TreeBuilder } from './index.js'
import type { Blockstore } from 'interface-blockstore'

/**
 * @typedef {import('./types').ImportResult} ImportResult
 * @typedef {import('./types').InProgressImportResult} InProgressImportResult
 * @typedef {import('./types').ImporterOptions} ImporterOptions
 * @typedef {import('interface-blockstore').Blockstore} Blockstore
 * @typedef {(source: AsyncIterable<InProgressImportResult>, blockstore: Blockstore, options: ImporterOptions) => AsyncIterable<ImportResult>} TreeBuilder
 */

async function addToTree (elem: InProgressImportResult, tree: Dir, options: ImporterOptions): Promise<Dir> {
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

async function * flushAndYield (tree: Dir | InProgressImportResult, blockstore: Blockstore): AsyncGenerator<ImportResult> {
  if (!(tree instanceof Dir)) {
    if (tree.unixfs?.isDirectory() === true) {
      yield tree
    }

    return
  }

  yield * tree.flush(blockstore)
}

export const treeBuilder: TreeBuilder = async function * treeBuilder (source, block, options) {
  let tree: Dir = new DirFlat({
    root: true,
    dir: true,
    path: '',
    dirty: true,
    flat: true
  }, options)

  for await (const entry of source) {
    if (entry == null) {
      continue
    }

    tree = await addToTree(entry, tree, options)

    if (entry.unixfs == null || !entry.unixfs.isDirectory()) {
      yield entry
    }
  }

  if (options.wrapWithDirectory) {
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
