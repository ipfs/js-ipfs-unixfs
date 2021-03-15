'use strict'

const batch = require('it-batch')

/**
 * @typedef {import('cids')} CID
 * @typedef {import('ipfs-unixfs').UnixFS} UnixFS
 * @typedef {import('../../types').ImporterOptions} ImporterOptions
 * @typedef {import('../../types').InProgressImportResult} InProgressImportResult
 * @typedef {import('../../types').TrickleDagNode} TrickleDagNode
 * @typedef {import('../../types').Reducer} Reducer
 * @typedef {import('../../types').FileDAGBuilder} FileDAGBuilder
 */

/**
 * @type {FileDAGBuilder}
 */
module.exports = async function trickleStream (source, reduce, options) {
  const root = new Root(options.layerRepeat)
  let iteration = 0
  let maxDepth = 1

  /** @type {SubTree} */
  let subTree = root

  for await (const layer of batch(source, options.maxChildrenPerNode)) {
    if (subTree.isFull()) {
      if (subTree !== root) {
        root.addChild(await subTree.reduce(reduce))
      }

      if (iteration && iteration % options.layerRepeat === 0) {
        maxDepth++
      }

      subTree = new SubTree(maxDepth, options.layerRepeat, iteration)

      iteration++
    }

    subTree.append(layer)
  }

  if (subTree && subTree !== root) {
    root.addChild(await subTree.reduce(reduce))
  }

  return root.reduce(reduce)
}

class SubTree {
  /**
   * @param {number} maxDepth
   * @param {number} layerRepeat
   * @param {number} [iteration=0]
   */
  constructor (maxDepth, layerRepeat, iteration = 0) {
    this.maxDepth = maxDepth
    this.layerRepeat = layerRepeat
    this.currentDepth = 1
    this.iteration = iteration

    /** @type {TrickleDagNode} */
    this.root = this.node = this.parent = {
      children: [],
      depth: this.currentDepth,
      maxDepth,
      maxChildren: (this.maxDepth - this.currentDepth) * this.layerRepeat
    }
  }

  isFull () {
    if (!this.root.data) {
      return false
    }

    if (this.currentDepth < this.maxDepth && this.node.maxChildren) {
      // can descend
      this._addNextNodeToParent(this.node)

      return false
    }

    // try to find new node from node.parent
    const distantRelative = this._findParent(this.node, this.currentDepth)

    if (distantRelative) {
      this._addNextNodeToParent(distantRelative)

      return false
    }

    return true
  }

  /**
   * @param {TrickleDagNode} parent
   */
  _addNextNodeToParent (parent) {
    this.parent = parent

    // find site for new node
    const nextNode = {
      children: [],
      depth: parent.depth + 1,
      parent,
      maxDepth: this.maxDepth,
      maxChildren: Math.floor(parent.children.length / this.layerRepeat) * this.layerRepeat
    }

    // @ts-ignore
    parent.children.push(nextNode)

    this.currentDepth = nextNode.depth
    this.node = nextNode
  }

  /**
   *
   * @param {InProgressImportResult[]} layer
   */
  append (layer) {
    this.node.data = layer
  }

  /**
   * @param {Reducer} reduce
   */
  reduce (reduce) {
    return this._reduce(this.root, reduce)
  }

  /**
   * @param {TrickleDagNode} node
   * @param {Reducer} reduce
   * @returns {Promise<InProgressImportResult>}
   */
  async _reduce (node, reduce) {
    /** @type {InProgressImportResult[]} */
    let children = []

    if (node.children.length) {
      children = await Promise.all(
        node.children
          // @ts-ignore
          .filter(child => child.data)
          // @ts-ignore
          .map(child => this._reduce(child, reduce))
      )
    }

    return reduce((node.data || []).concat(children))
  }

  /**
   * @param {TrickleDagNode} node
   * @param {number} depth
   * @returns {TrickleDagNode | undefined}
   */
  _findParent (node, depth) {
    const parent = node.parent

    if (!parent || parent.depth === 0) {
      return
    }

    if (parent.children.length === parent.maxChildren || !parent.maxChildren) {
      // this layer is full, may be able to traverse to a different branch
      return this._findParent(parent, depth)
    }

    return parent
  }
}

class Root extends SubTree {
  /**
   * @param {number} layerRepeat
   */
  constructor (layerRepeat) {
    super(0, layerRepeat)

    this.root.depth = 0
    this.currentDepth = 1
  }

  /**
   * @param {InProgressImportResult} child
   */
  addChild (child) {
    this.root.children.push(child)
  }

  /**
   * @param {Reducer} reduce
   */
  reduce (reduce) {
    return reduce((this.root.data || []).concat(this.root.children))
  }
}
