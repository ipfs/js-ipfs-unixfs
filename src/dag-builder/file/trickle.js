'use strict'

const batch = require('async-iterator-batch')

module.exports = async function * trickleReduceToRoot (source, reduce, options) {
  yield trickleStream(source, reduce, options)
}

async function trickleStream (source, reduce, options) {
  let root = {
    children: []
  }
  let node = root
  let maxDepth = 1
  let currentDepth = 1
  let layerSize = 0

  for await (const layer of batch(source, options.maxChildrenPerNode)) {
    node.data = layer

    let parent = node.parent || root
    const nextNode = {
      children: []
    }

    if (currentDepth < maxDepth) {
      // the current layer can't have more children
      // but we can descend a layer
      node.children.push(nextNode)
      nextNode.parent = node
      node = nextNode
      currentDepth++
    } else if (parent.children.length < options.layerRepeat) {
      // the current layer can have more children
      parent.children.push(nextNode)
      nextNode.parent = parent
      node = nextNode
    } else if (currentDepth === maxDepth) {
      // hit the bottom of the current iteration, can we find a sibling?
      parent = findNext(root, 0, maxDepth, options)

      if (parent) {
        nextNode.parent = parent
        parent.children.push(nextNode)
        node = nextNode
      } else {
        if (layerSize === 0) {
          maxDepth++
        }

        layerSize++

        if (layerSize === options.layerRepeat) {
          layerSize = 0
        }

        nextNode.parent = root
        root.children.push(nextNode)
        node = nextNode

        currentDepth = 1
      }
    }
  }

  // reduce to root
  return walk(root, reduce)
}

const walk = async (node, reduce) => {
  let children = []

  if (node.children.length) {
    children = await Promise.all(
      node.children
        .filter(child => child.data)
        .map(child => walk(child, reduce))
    )
  }

  return reduce(node.data.concat(children))
}

const findNext = (node, depth, maxDepth, options) => {
  if (depth === maxDepth) {
    return
  }

  let nodeMatches = false

  if (node.children.length < options.layerRepeat) {
    nodeMatches = true
  }

  if (node.children.length) {
    const childMatches = findNext(node.children[node.children.length - 1], depth + 1, maxDepth, options)

    if (childMatches) {
      return childMatches
    }
  }

  if (nodeMatches) {
    return node
  }
}
