import batch from 'it-batch'
import type { InProgressImportResult } from '../index.js'
import type { FileLayout, Reducer } from '../layout/index.js'
import type { UnixFS } from 'ipfs-unixfs'
import type { CID } from 'multiformats/cid'

const DEFAULT_LAYER_REPEAT = 4
const DEFAULT_MAX_CHILDREN_PER_NODE = 174

interface TrickleDagNode {
  children: InProgressImportResult[]
  depth: number
  maxDepth: number
  maxChildren: number
  data?: InProgressImportResult[]
  parent?: TrickleDagNode
  cid?: CID
  size?: number
  unixfs?: UnixFS
}

export interface TrickleOptions {
  layerRepeat?: number
  maxChildrenPerNode?: number
}

/**
 * @see https://github.com/ipfs/specs/pull/57#issuecomment-265205384
 */
export function trickle (options?: TrickleOptions): FileLayout {
  const layerRepeat = options?.layerRepeat ?? DEFAULT_LAYER_REPEAT
  const maxChildrenPerNode = options?.maxChildrenPerNode ?? DEFAULT_MAX_CHILDREN_PER_NODE

  return async function trickleLayout (source, reduce): Promise<InProgressImportResult> {
    const root = new Root(layerRepeat)
    let iteration = 0
    let maxDepth = 1
    let subTree: SubTree = root

    for await (const layer of batch(source, maxChildrenPerNode)) {
      if (subTree.isFull()) {
        if (subTree !== root) {
          root.addChild(await subTree.reduce(reduce))
        }

        if (iteration > 0 && iteration % layerRepeat === 0) {
          maxDepth++
        }

        subTree = new SubTree(maxDepth, layerRepeat, iteration)

        iteration++
      }

      subTree.append(layer)
    }

    if (subTree != null && subTree !== root) {
      root.addChild(await subTree.reduce(reduce))
    }

    return root.reduce(reduce)
  }
}

class SubTree {
  public root: TrickleDagNode
  public node: TrickleDagNode
  public parent: TrickleDagNode
  public maxDepth: number
  public layerRepeat: number
  public currentDepth: number
  public iteration: number

  constructor (maxDepth: number, layerRepeat: number, iteration: number = 0) {
    this.maxDepth = maxDepth
    this.layerRepeat = layerRepeat
    this.currentDepth = 1
    this.iteration = iteration

    this.root = this.node = this.parent = {
      children: [],
      depth: this.currentDepth,
      maxDepth,
      maxChildren: (this.maxDepth - this.currentDepth) * this.layerRepeat
    }
  }

  isFull (): boolean {
    if (this.root.data == null) {
      return false
    }

    if (this.currentDepth < this.maxDepth && this.node.maxChildren > 0) {
      // can descend
      this._addNextNodeToParent(this.node)

      return false
    }

    // try to find new node from node.parent
    const distantRelative = this._findParent(this.node, this.currentDepth)

    if (distantRelative != null) {
      this._addNextNodeToParent(distantRelative)

      return false
    }

    return true
  }

  _addNextNodeToParent (parent: TrickleDagNode): void {
    this.parent = parent

    // find site for new node
    const nextNode = {
      children: [],
      depth: parent.depth + 1,
      parent,
      maxDepth: this.maxDepth,
      maxChildren: Math.floor(parent.children.length / this.layerRepeat) * this.layerRepeat
    }

    // @ts-expect-error nextNode is different type
    parent.children.push(nextNode)

    this.currentDepth = nextNode.depth
    this.node = nextNode
  }

  append (layer: InProgressImportResult[]): void {
    this.node.data = layer
  }

  async reduce (reduce: Reducer): Promise<InProgressImportResult> {
    return this._reduce(this.root, reduce)
  }

  async _reduce (node: TrickleDagNode, reduce: Reducer): Promise<InProgressImportResult> {
    let children: InProgressImportResult[] = []

    if (node.children.length > 0) {
      children = await Promise.all(
        node.children
          // @ts-expect-error data is not present on type
          .filter(child => child.data)
          // @ts-expect-error child is wrong type
          .map(async child => this._reduce(child, reduce))
      )
    }

    return reduce((node.data ?? []).concat(children))
  }

  _findParent (node: TrickleDagNode, depth: number): TrickleDagNode | undefined {
    const parent = node.parent

    if (parent == null || parent.depth === 0) {
      return
    }

    if (parent.children.length === parent.maxChildren || parent.maxChildren === 0) {
      // this layer is full, may be able to traverse to a different branch
      return this._findParent(parent, depth)
    }

    return parent
  }
}

class Root extends SubTree {
  constructor (layerRepeat: number) {
    super(0, layerRepeat)

    this.root.depth = 0
    this.currentDepth = 1
  }

  addChild (child: InProgressImportResult): void {
    this.root.children.push(child)
  }

  async reduce (reduce: Reducer): Promise<InProgressImportResult> {
    return reduce((this.root.data ?? []).concat(this.root.children))
  }
}
