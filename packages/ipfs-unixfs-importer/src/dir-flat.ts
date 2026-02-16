import { encode, prepare } from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import { Dir } from './dir.ts'
import { persist } from './utils/persist.ts'
import type { DirProps } from './dir.ts'
import type { ImportResult, InProgressImportResult } from './index.ts'
import type { AddToTreeOptions } from './tree-builder.ts'
import type { PBLink, PBNode } from '@ipld/dag-pb'
import type { Blockstore } from 'interface-blockstore'
import type { CID } from 'multiformats/cid'

export class DirFlat extends Dir {
  private readonly _children: Map<string, InProgressImportResult | Dir>

  constructor (props: DirProps, options: AddToTreeOptions) {
    super(props, options)

    this._children = new Map()
  }

  async put (name: string, value: InProgressImportResult | Dir): Promise<void> {
    this.cid = undefined
    this.size = undefined
    this.nodeSize = undefined

    this._children.set(name, value)
  }

  async get (name: string): Promise<InProgressImportResult | Dir | undefined> {
    return Promise.resolve(this._children.get(name))
  }

  childCount (): number {
    return this._children.size
  }

  directChildrenCount (): number {
    return this.childCount()
  }

  onlyChild (): InProgressImportResult | Dir | undefined {
    return this._children.values().next().value
  }

  * eachChildSeries (): Generator<{ key: string, child: InProgressImportResult | Dir }, void, undefined> {
    for (const [key, child] of this._children.entries()) {
      yield {
        key,
        child
      }
    }
  }

  marshal (): Uint8Array {
    const unixfs = new UnixFS({
      type: 'directory',
      mtime: this.mtime,
      mode: this.mode
    })

    const links: PBLink[] = []

    for (const [name, child] of this._children.entries()) {
      if (child.size == null || child.cid == null) {
        continue
      }

      if (child.cid == null) {
        throw new Error('Directory contents must be flushed before marshaling')
      }

      links.push({
        Hash: child.cid,
        Name: name,
        Tsize: child.size == null ? undefined : Number(child.size)
      })
    }

    const node: PBNode = {
      Data: unixfs.marshal(),
      Links: links
    }

    return encode(prepare(node))
  }

  async estimateNodeSize (): Promise<number> {
    if (this.nodeSize !== undefined) {
      return this.nodeSize
    }

    this.nodeSize = 0

    if (this.options?.shardSplitStrategy === 'links-bytes') {
      // estimate size only based on DAGLink name and CID byte lengths
      // @see https://github.com/ipfs/go-unixfsnode/blob/37b47f1f917f1b2f54c207682f38886e49896ef9/data/builder/directory.go#L81-L96
      for (const [name, child] of this._children.entries()) {
        if (child.size != null && (child.cid != null)) {
          this.nodeSize += name.length + child.cid.byteLength
        }
      }
    } else {
      this.nodeSize = this.marshal().byteLength
    }

    return this.nodeSize
  }

  async * flush (block: Blockstore): AsyncGenerator<ImportResult> {
    const links = []

    for (const [name, child] of this._children.entries()) {
      let result: { size?: bigint | number, cid?: CID } = child

      if (child instanceof Dir) {
        for await (const entry of child.flush(block)) {
          result = entry

          yield entry
        }
      }

      if (result.size != null && (result.cid != null)) {
        links.push({
          Name: name,
          Tsize: Number(result.size),
          Hash: result.cid
        })
      }
    }

    const unixfs = new UnixFS({
      type: 'directory',
      mtime: this.mtime,
      mode: this.mode
    })

    const node: PBNode = { Data: unixfs.marshal(), Links: links }
    const buffer = encode(prepare(node))
    const cid = await persist(buffer, block, this.options)
    const size = buffer.length + node.Links.reduce(
      /**
       * @param {number} acc
       * @param {PBLink} curr
       */
      (acc, curr) => acc + (curr.Tsize ?? 0),
      0)

    this.cid = cid
    this.size = size

    yield {
      cid,
      unixfs,
      path: this.path,
      size: BigInt(size)
    }
  }
}
