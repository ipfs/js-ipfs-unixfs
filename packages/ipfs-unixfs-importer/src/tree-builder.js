'use strict'

const DirFlat = require('./dir-flat')
const flatToShard = require('./flat-to-shard')
const Dir = require('./dir')
const toPathComponents = require('./utils/to-path-components')

async function addToTree (elem, tree, options) {
  const pathElems = toPathComponents(elem.path || '')
  const lastIndex = pathElems.length - 1
  let parent = tree
  let currentPath = ''

  for (let i = 0; i < pathElems.length; i++) {
    const pathElem = pathElems[i]

    currentPath += `${currentPath ? '/' : ''}${pathElem}`

    const last = (i === lastIndex)
    parent.dirty = true
    parent.cid = null
    parent.size = null

    if (last) {
      await parent.put(pathElem, elem)
      tree = await flatToShard(null, parent, options.shardSplitThreshold, options)
    } else {
      let dir = await parent.get(pathElem)

      if (!dir || !(dir instanceof Dir)) {
        dir = new DirFlat({
          dir: true,
          parent: parent,
          parentKey: pathElem,
          path: currentPath,
          dirty: true,
          flat: true,
          mtime: dir && dir.unixfs && dir.unixfs.mtime,
          mode: dir && dir.unixfs && dir.unixfs.mode
        }, options)
      }

      await parent.put(pathElem, dir)

      parent = dir
    }
  }

  return tree
}

async function * flushAndYield (tree, block) {
  if (!(tree instanceof Dir)) {
    if (tree && tree.unixfs && tree.unixfs.isDirectory()) {
      yield tree
    }

    return
  }

  yield * tree.flush(tree.path, block)
}

async function * treeBuilder (source, block, options) {
  let tree = new DirFlat({
    root: true,
    dir: true,
    path: '',
    dirty: true,
    flat: true
  }, options)

  for await (const entry of source) {
    if (!entry) {
      continue
    }

    tree = await addToTree(entry, tree, options)

    if (!entry.unixfs || !entry.unixfs.isDirectory()) {
      yield entry
    }
  }

  if (options.wrapWithDirectory) {
    yield * flushAndYield(tree, block)
  } else {
    for await (const unwrapped of tree.eachChildSeries()) {
      if (!unwrapped) {
        continue
      }

      yield * flushAndYield(unwrapped.child, block)
    }
  }
}

module.exports = treeBuilder
