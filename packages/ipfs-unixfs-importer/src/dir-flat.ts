import { encode, prepare } from '@ipld/dag-pb'
import { UnixFS } from 'ipfs-unixfs'
import { Dir } from './dir.ts'
import { InvalidShardingStrategyError } from './index.ts'
import { dataFieldSerializedSize, linkSerializedSize, utf8ByteLength } from './utils/pb-size.ts'
import { persist } from './utils/persist.ts'
import type { DirProps } from './dir.ts'
import type { ImportResult, InProgressImportResult, WritableStorage } from './index.ts'
import type { AddToTreeOptions } from './tree-builder.ts'
import type { PBLink, PBNode } from '@ipld/dag-pb'
import type { CID } from 'multiformats/cid'

function estimateLinkSize (nameBytes: number, child: InProgressImportResult | Dir | undefined): number {
  if (child?.cid != null && child?.size != null) {
    return nameBytes + child.cid.byteLength
  }

  return 0
}

function calculateLinkSize (nameBytes: number, child: InProgressImportResult | Dir | undefined): number {
  if (child?.cid != null && child?.size != null) {
    return linkSerializedSize(
      nameBytes, child.cid.byteLength, Number(child.size)
    )
  }

  return 0
}

export class DirFlat extends Dir {
  private readonly _children: Map<string, InProgressImportResult | Dir>

  constructor (props: DirProps, options: AddToTreeOptions) {
    super(props, options)

    this._children = new Map()
  }

  async put (name: string, value: InProgressImportResult | Dir): Promise<void> {
    if (this.nodeSize !== undefined) {
      const oldChild = this._children.get(name)
      const nameBytes = utf8ByteLength(name)

      const strategy = this.options?.shardSplitStrategy
      if (strategy === 'links-bytes') {
        this.nodeSize -= estimateLinkSize(nameBytes, oldChild)
        this.nodeSize += estimateLinkSize(nameBytes, value)
      } else if (strategy === 'block-bytes') {
        this.nodeSize -= calculateLinkSize(nameBytes, oldChild)
        this.nodeSize += calculateLinkSize(nameBytes, value)
      } else {
        throw new InvalidShardingStrategyError(`Invalid shardSplitStrategy: ${strategy}`)
      }

      // safety: reset on underflow to force recomputation
      if (this.nodeSize < 0) {
        this.nodeSize = undefined
      }
    }

    this.cid = undefined
    this.size = undefined
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

    const strategy = this.options?.shardSplitStrategy
    if (strategy === 'links-bytes') {
      // estimate size based on DAGLink name (UTF-8 byte length) and CID byte lengths
      // @see https://github.com/ipfs/go-unixfsnode/blob/37b47f1f917f1b2f54c207682f38886e49896ef9/data/builder/directory.go#L81-L96
      this.nodeSize = 0

      for (const [name, child] of this._children.entries()) {
        this.nodeSize += estimateLinkSize(utf8ByteLength(name), child)
      }
    } else if (strategy === 'block-bytes') {
      // compute exact serialized size arithmetically
      // (matches marshal().byteLength without allocating byte arrays)
      this.nodeSize = dataFieldSerializedSize(this.mode, this.mtime)

      for (const [name, child] of this._children.entries()) {
        this.nodeSize += calculateLinkSize(utf8ByteLength(name), child)
      }
    } else {
      throw new InvalidShardingStrategyError(`Invalid shardSplitStrategy: ${strategy}`)
    }

    return this.nodeSize
  }

  async * flush (block: WritableStorage): AsyncGenerator<ImportResult> {
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
