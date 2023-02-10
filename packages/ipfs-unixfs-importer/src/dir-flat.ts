import { encode, PBNode, prepare } from '@ipld/dag-pb'
import type { Blockstore } from 'interface-blockstore'
import { UnixFS } from 'ipfs-unixfs'
import { Dir, CID_V0, CID_V1, DirProps } from './dir.js'
import type { ImporterOptions, ImportResult, InProgressImportResult } from './index.js'
import { persist } from './utils/persist.js'

export class DirFlat extends Dir {
  private readonly _children: Map<string, InProgressImportResult | Dir>

  constructor (props: DirProps, options: ImporterOptions) {
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
    return await Promise.resolve(this._children.get(name))
  }

  childCount (): number {
    return this._children.size
  }

  directChildrenCount (): number {
    return this.childCount()
  }

  onlyChild (): InProgressImportResult | Dir {
    return this._children.values().next().value
  }

  async * eachChildSeries (): AsyncGenerator<{ key: string, child: InProgressImportResult | Dir }, void, undefined> {
    for (const [key, child] of this._children.entries()) {
      yield {
        key,
        child
      }
    }
  }

  estimateNodeSize (): number {
    if (this.nodeSize !== undefined) {
      return this.nodeSize
    }

    this.nodeSize = 0

    // estimate size only based on DAGLink name and CID byte lengths
    // https://github.com/ipfs/go-unixfsnode/blob/37b47f1f917f1b2f54c207682f38886e49896ef9/data/builder/directory.go#L81-L96
    for (const [name, child] of this._children.entries()) {
      if (child.size != null && (child.cid != null)) {
        this.nodeSize += name.length + (this.options.cidVersion === 1 ? CID_V1.bytes.byteLength : CID_V0.bytes.byteLength)
      }
    }

    return this.nodeSize
  }

  async * flush (block: Blockstore): AsyncGenerator<ImportResult> {
    const links = []

    for (let [name, child] of this._children.entries()) {
      if (child instanceof Dir) {
        for await (const entry of child.flush(block)) {
          child = entry

          yield child
        }
      }

      if (child.size != null && (child.cid != null)) {
        links.push({
          Name: name,
          Tsize: Number(child.size),
          Hash: child.cid
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
      (acc, curr) => acc + (curr.Tsize == null ? 0 : curr.Tsize),
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
