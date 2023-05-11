import { encode, type PBLink, prepare } from '@ipld/dag-pb'
import { murmur3128 } from '@multiformats/murmur3'
import { createHAMT, Bucket, type BucketChild } from 'hamt-sharding'
import { UnixFS } from 'ipfs-unixfs'
import { Dir, CID_V0, CID_V1, type DirProps } from './dir.js'
import { persist, type PersistOptions } from './utils/persist.js'
import type { ImportResult, InProgressImportResult } from './index.js'
import type { Blockstore } from 'interface-blockstore'

async function hamtHashFn (buf: Uint8Array): Promise<Uint8Array> {
  return (await murmur3128.encode(buf))
    // Murmur3 outputs 128 bit but, accidentally, IPFS Go's
    // implementation only uses the first 64, so we must do the same
    // for parity..
    .slice(0, 8)
    // Invert buffer because that's how Go impl does it
    .reverse()
}

const HAMT_HASH_CODE = BigInt(0x22)

class DirSharded extends Dir {
  private readonly _bucket: Bucket<InProgressImportResult | Dir>

  constructor (props: DirProps, options: PersistOptions) {
    super(props, options)

    this._bucket = createHAMT({
      hashFn: hamtHashFn,
      bits: 8
    })
  }

  async put (name: string, value: InProgressImportResult | Dir): Promise<void> {
    this.cid = undefined
    this.size = undefined
    this.nodeSize = undefined

    await this._bucket.put(name, value)
  }

  async get (name: string): Promise<InProgressImportResult | Dir | undefined> {
    return this._bucket.get(name)
  }

  childCount (): number {
    return this._bucket.leafCount()
  }

  directChildrenCount (): number {
    return this._bucket.childrenCount()
  }

  onlyChild (): Bucket<InProgressImportResult | Dir> | BucketChild<InProgressImportResult | Dir> {
    return this._bucket.onlyChild()
  }

  async * eachChildSeries (): AsyncGenerator<{ key: string, child: InProgressImportResult | Dir }> {
    for await (const { key, value } of this._bucket.eachLeafSeries()) {
      yield {
        key,
        child: value
      }
    }
  }

  estimateNodeSize (): number {
    if (this.nodeSize !== undefined) {
      return this.nodeSize
    }

    this.nodeSize = calculateSize(this._bucket, this, this.options)

    return this.nodeSize
  }

  async * flush (blockstore: Blockstore): AsyncGenerator<ImportResult> {
    for await (const entry of flush(this._bucket, blockstore, this, this.options)) {
      yield {
        ...entry,
        path: this.path
      }
    }
  }
}

export default DirSharded

async function * flush (bucket: Bucket<Dir | InProgressImportResult>, blockstore: Blockstore, shardRoot: DirSharded | null, options: PersistOptions): AsyncIterable<ImportResult> {
  const children = bucket._children
  const links: PBLink[] = []
  let childrenSize = 0n

  for (let i = 0; i < children.length; i++) {
    const child = children.get(i)

    if (child == null) {
      continue
    }

    const labelPrefix = i.toString(16).toUpperCase().padStart(2, '0')

    if (child instanceof Bucket) {
      let shard

      for await (const subShard of flush(child, blockstore, null, options)) {
        shard = subShard
      }

      if (shard == null) {
        throw new Error('Could not flush sharded directory, no subshard found')
      }

      links.push({
        Name: labelPrefix,
        Tsize: Number(shard.size),
        Hash: shard.cid
      })
      childrenSize += shard.size
    } else if (isDir(child.value)) {
      const dir = child.value
      let flushedDir: ImportResult | undefined

      for await (const entry of dir.flush(blockstore)) {
        flushedDir = entry

        yield flushedDir
      }

      if (flushedDir == null) {
        throw new Error('Did not flush dir')
      }

      const label = labelPrefix + child.key
      links.push({
        Name: label,
        Tsize: Number(flushedDir.size),
        Hash: flushedDir.cid
      })

      childrenSize += flushedDir.size
    } else {
      const value = child.value

      if (value.cid == null) {
        continue
      }

      const label = labelPrefix + child.key
      const size = value.size

      links.push({
        Name: label,
        Tsize: Number(size),
        Hash: value.cid
      })
      childrenSize += BigInt(size ?? 0)
    }
  }

  // go-ipfs uses little endian, that's why we have to
  // reverse the bit field before storing it
  const data = Uint8Array.from(children.bitField().reverse())
  const dir = new UnixFS({
    type: 'hamt-sharded-directory',
    data,
    fanout: BigInt(bucket.tableSize()),
    hashType: HAMT_HASH_CODE,
    mtime: shardRoot?.mtime,
    mode: shardRoot?.mode
  })

  const node = {
    Data: dir.marshal(),
    Links: links
  }
  const buffer = encode(prepare(node))
  const cid = await persist(buffer, blockstore, options)
  const size = BigInt(buffer.byteLength) + childrenSize

  yield {
    cid,
    unixfs: dir,
    size
  }
}

function isDir (obj: any): obj is Dir {
  return typeof obj.flush === 'function'
}

function calculateSize (bucket: Bucket<any>, shardRoot: DirSharded | null, options: PersistOptions): number {
  const children = bucket._children
  const links: PBLink[] = []

  for (let i = 0; i < children.length; i++) {
    const child = children.get(i)

    if (child == null) {
      continue
    }

    const labelPrefix = i.toString(16).toUpperCase().padStart(2, '0')

    if (child instanceof Bucket) {
      const size = calculateSize(child, null, options)

      links.push({
        Name: labelPrefix,
        Tsize: Number(size),
        Hash: options.cidVersion === 0 ? CID_V0 : CID_V1
      })
    } else if (typeof child.value.flush === 'function') {
      const dir = child.value
      const size = dir.nodeSize()

      links.push({
        Name: labelPrefix + child.key,
        Tsize: Number(size),
        Hash: options.cidVersion === 0 ? CID_V0 : CID_V1
      })
    } else {
      const value = child.value

      if (value.cid == null) {
        continue
      }

      const label = labelPrefix + child.key
      const size = value.size

      links.push({
        Name: label,
        Tsize: Number(size),
        Hash: value.cid
      })
    }
  }

  // go-ipfs uses little endian, that's why we have to
  // reverse the bit field before storing it
  const data = Uint8Array.from(children.bitField().reverse())
  const dir = new UnixFS({
    type: 'hamt-sharded-directory',
    data,
    fanout: BigInt(bucket.tableSize()),
    hashType: HAMT_HASH_CODE,
    mtime: shardRoot?.mtime,
    mode: shardRoot?.mode
  })

  const buffer = encode(prepare({
    Data: dir.marshal(),
    Links: links
  }))

  return buffer.length
}
