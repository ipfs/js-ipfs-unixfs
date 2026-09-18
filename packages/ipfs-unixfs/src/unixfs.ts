import { decodeMessage, encodeMessage, enumeration, MaxLengthError, message, streamMessage } from 'protons-runtime'
import type { Codec, DecodeOptions } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface UnixFS {
  type?: UnixFS.Type
  data?: Uint8Array<ArrayBuffer>
  fileSize?: bigint
  blockSizes: bigint[]
  hashType?: bigint
  fanOut?: bigint
  mode?: number
  mtime?: UnixTime
}

export interface UnixFSInput {
  type?: UnixFS.Type
  data?: Uint8Array
  fileSize?: bigint
  blockSizes?: bigint[]
  hashType?: bigint
  fanOut?: bigint
  mode?: number
  mtime?: UnixTimeInput
}

export namespace UnixFS {
  export enum Type {
    RAW = 'RAW',
    DIRECTORY = 'DIRECTORY',
    FILE = 'FILE',
    METADATA = 'METADATA',
    SYMLINK = 'SYMLINK',
    HAMT_SHARD = 'HAMT_SHARD'
  }

  enum __TypeValues {
    RAW = 0,
    DIRECTORY = 1,
    FILE = 2,
    METADATA = 3,
    SYMLINK = 4,
    HAMT_SHARD = 5
  }

  export namespace Type {
    export const codec = (): Codec<Type, Type> => {
      return enumeration<Type>(__TypeValues)
    }
  }

  let _codec: Codec<UnixFS, UnixFSInput>

  export const codec = (): Codec<UnixFS, UnixFSInput> => {
    if (_codec == null) {
      _codec = message<UnixFS, UnixFSInput>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.type != null) {
          w.uint32(8)
          UnixFS.Type.codec().encode(obj.type, w)
        }

        if (obj.data != null) {
          w.uint32(18)
          w.bytes(obj.data)
        }

        if (obj.fileSize != null) {
          w.uint32(24)
          w.uint64(obj.fileSize)
        }

        if (obj.blockSizes != null && obj.blockSizes.length > 0) {
          for (const value of obj.blockSizes) {
            w.uint32(32)
            w.uint64(value)
          }
        }

        if (obj.hashType != null) {
          w.uint32(40)
          w.uint64(obj.hashType)
        }

        if (obj.fanOut != null) {
          w.uint32(48)
          w.uint64(obj.fanOut)
        }

        if (obj.mode != null) {
          w.uint32(56)
          w.uint32(obj.mode)
        }

        if (obj.mtime != null) {
          w.uint32(66)
          UnixTime.codec().encode(obj.mtime, w)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (r, length, opts = {}) => {
        const obj: any = {
          blockSizes: []
        }

        const end = length == null ? r.len : r.pos + length

        while (r.pos < end) {
          const tag = r.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.type = UnixFS.Type.codec().decode(r)
              break
            }
            case 2: {
              obj.data = r.bytes()
              break
            }
            case 3: {
              obj.fileSize = r.uint64()
              break
            }
            case 4: {
              if (opts.limits?.blockSizes != null && obj.blockSizes.length === opts.limits.blockSizes) {
                throw new MaxLengthError('Decode error - repeated field "blockSizes" had too many elements')
              }

              obj.blockSizes.push(r.uint64())
              break
            }
            case 5: {
              obj.hashType = r.uint64()
              break
            }
            case 6: {
              obj.fanOut = r.uint64()
              break
            }
            case 7: {
              obj.mode = r.uint32()
              break
            }
            case 8: {
              obj.mtime = UnixTime.codec().decode(r, r.uint32(), {
                limits: opts.limits?.mtime
              })
              break
            }
            default: {
              r.skipType(tag & 7)
              break
            }
          }
        }

        return obj
      }, function * (r, length, prefix, opts = {}) {
        const obj = {
          blockSizes: 0
        }

        const end = length == null ? r.len : r.pos + length

        if (prefix !== '.') {
          yield {
            field: prefix.endsWith('.') ? prefix.substring(0, prefix.length - 1) : prefix,
            type: 'start',
            message: 'UnixFS'
          }
        }

        while (r.pos < end) {
          const tag = r.uint32()

          switch (tag >>> 3) {
            case 1: {
              yield {
                field: `${prefix}type`,
                value: UnixFS.Type.codec().decode(r)
              }
              break
            }
            case 2: {
              yield {
                field: `${prefix}data`,
                value: r.bytes()
              }
              break
            }
            case 3: {
              yield {
                field: `${prefix}fileSize`,
                value: r.uint64()
              }
              break
            }
            case 4: {
              if (opts.limits?.blockSizes != null && obj.blockSizes === opts.limits.blockSizes) {
                throw new MaxLengthError('Streaming decode error - repeated field "blockSizes" had too many elements')
              }

              yield {
                field: `${prefix}blockSizes[]`,
                index: obj.blockSizes,
                value: r.uint64()
              }

              obj.blockSizes++

              break
            }
            case 5: {
              yield {
                field: `${prefix}hashType`,
                value: r.uint64()
              }
              break
            }
            case 6: {
              yield {
                field: `${prefix}fanOut`,
                value: r.uint64()
              }
              break
            }
            case 7: {
              yield {
                field: `${prefix}mode`,
                value: r.uint32()
              }
              break
            }
            case 8: {
              yield * UnixTime.codec().stream(r, r.uint32(), `${prefix}mtime.`, {
                limits: opts.limits?.mtime
              })

              break
            }
            default: {
              r.skipType(tag & 7)
              break
            }
          }
        }

        if (prefix !== '.') {
          yield {
            field: prefix.endsWith('.') ? prefix.substring(0, prefix.length - 1) : prefix,
            type: 'end',
            message: 'UnixFS'
          }
        }
      })
    }

    return _codec
  }

  export interface UnixFSTypeFieldEvent {
    field: '.type'
    value: UnixFS.Type
  }

  export interface UnixFSDataFieldEvent {
    field: '.data'
    value: Uint8Array<ArrayBuffer>
  }

  export interface UnixFSFileSizeFieldEvent {
    field: '.fileSize'
    value: bigint
  }

  export interface UnixFSBlockSizesFieldEvent {
    field: '.blockSizes[]'
    index: number
    value: bigint
  }

  export interface UnixFSHashTypeFieldEvent {
    field: '.hashType'
    value: bigint
  }

  export interface UnixFSFanOutFieldEvent {
    field: '.fanOut'
    value: bigint
  }

  export interface UnixFSModeFieldEvent {
    field: '.mode'
    value: number
  }

  export interface UnixFSMtimeMessageStart {
    field: '.mtime'
    type: 'start'
  }

  export interface UnixFSMtimeMessageEnd {
    field: '.mtime'
    type: 'end'
  }

  export interface UnixFSMtimeSecondsFieldEvent {
    field: '.mtime.seconds'
    value: bigint
  }

  export interface UnixFSMtimeFractionalNanosecondsFieldEvent {
    field: '.mtime.fractionalNanoseconds'
    value: number
  }

  export function encode (obj: UnixFSInput): Uint8Array<ArrayBuffer> {
    return encodeMessage(obj, UnixFS.codec())
  }

  export function decode (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<UnixFS>): UnixFS {
    return decodeMessage(buf, UnixFS.codec(), opts)
  }

  export function stream (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<UnixFS>): Generator<UnixFSTypeFieldEvent | UnixFSDataFieldEvent | UnixFSFileSizeFieldEvent | UnixFSBlockSizesFieldEvent | UnixFSHashTypeFieldEvent | UnixFSFanOutFieldEvent | UnixFSModeFieldEvent | UnixFSMtimeMessageStart | UnixFSMtimeMessageEnd | UnixFSMtimeSecondsFieldEvent | UnixFSMtimeFractionalNanosecondsFieldEvent> {
    return streamMessage(buf, UnixFS.codec(), opts)
  }
}

export interface UnixTime {
  seconds?: bigint
  fractionalNanoseconds?: number
}

export interface UnixTimeInput {
  seconds?: bigint
  fractionalNanoseconds?: number
}

export namespace UnixTime {
  let _codec: Codec<UnixTime, UnixTimeInput>

  export const codec = (): Codec<UnixTime, UnixTimeInput> => {
    if (_codec == null) {
      _codec = message<UnixTime, UnixTimeInput>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.seconds != null) {
          w.uint32(8)
          w.int64(obj.seconds)
        }

        if (obj.fractionalNanoseconds != null) {
          w.uint32(21)
          w.fixed32(obj.fractionalNanoseconds)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (r, length) => {
        const obj: any = {}

        const end = length == null ? r.len : r.pos + length

        while (r.pos < end) {
          const tag = r.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.seconds = r.int64()
              break
            }
            case 2: {
              obj.fractionalNanoseconds = r.fixed32()
              break
            }
            default: {
              r.skipType(tag & 7)
              break
            }
          }
        }

        return obj
      }, function * (r, length, prefix) {
        const end = length == null ? r.len : r.pos + length

        if (prefix !== '.') {
          yield {
            field: prefix.endsWith('.') ? prefix.substring(0, prefix.length - 1) : prefix,
            type: 'start',
            message: 'UnixTime'
          }
        }

        while (r.pos < end) {
          const tag = r.uint32()

          switch (tag >>> 3) {
            case 1: {
              yield {
                field: `${prefix}seconds`,
                value: r.int64()
              }
              break
            }
            case 2: {
              yield {
                field: `${prefix}fractionalNanoseconds`,
                value: r.fixed32()
              }
              break
            }
            default: {
              r.skipType(tag & 7)
              break
            }
          }
        }

        if (prefix !== '.') {
          yield {
            field: prefix.endsWith('.') ? prefix.substring(0, prefix.length - 1) : prefix,
            type: 'end',
            message: 'UnixTime'
          }
        }
      })
    }

    return _codec
  }

  export interface UnixTimeSecondsFieldEvent {
    field: '.seconds'
    value: bigint
  }

  export interface UnixTimeFractionalNanosecondsFieldEvent {
    field: '.fractionalNanoseconds'
    value: number
  }

  export function encode (obj: UnixTimeInput): Uint8Array<ArrayBuffer> {
    return encodeMessage(obj, UnixTime.codec())
  }

  export function decode (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<UnixTime>): UnixTime {
    return decodeMessage(buf, UnixTime.codec(), opts)
  }

  export function stream (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<UnixTime>): Generator<UnixTimeSecondsFieldEvent | UnixTimeFractionalNanosecondsFieldEvent> {
    return streamMessage(buf, UnixTime.codec(), opts)
  }
}

export interface Metadata {
  mimeType?: string
}

export interface MetadataInput {
  mimeType?: string
}

export namespace Metadata {
  let _codec: Codec<Metadata, MetadataInput>

  export const codec = (): Codec<Metadata, MetadataInput> => {
    if (_codec == null) {
      _codec = message<Metadata, MetadataInput>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.mimeType != null) {
          w.uint32(10)
          w.string(obj.mimeType)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (r, length) => {
        const obj: any = {}

        const end = length == null ? r.len : r.pos + length

        while (r.pos < end) {
          const tag = r.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.mimeType = r.string()
              break
            }
            default: {
              r.skipType(tag & 7)
              break
            }
          }
        }

        return obj
      }, function * (r, length, prefix) {
        const end = length == null ? r.len : r.pos + length

        if (prefix !== '.') {
          yield {
            field: prefix.endsWith('.') ? prefix.substring(0, prefix.length - 1) : prefix,
            type: 'start',
            message: 'Metadata'
          }
        }

        while (r.pos < end) {
          const tag = r.uint32()

          switch (tag >>> 3) {
            case 1: {
              yield {
                field: `${prefix}mimeType`,
                value: r.string()
              }
              break
            }
            default: {
              r.skipType(tag & 7)
              break
            }
          }
        }

        if (prefix !== '.') {
          yield {
            field: prefix.endsWith('.') ? prefix.substring(0, prefix.length - 1) : prefix,
            type: 'end',
            message: 'Metadata'
          }
        }
      })
    }

    return _codec
  }

  export interface MetadataMimeTypeFieldEvent {
    field: '.mimeType'
    value: string
  }

  export function encode (obj: MetadataInput): Uint8Array<ArrayBuffer> {
    return encodeMessage(obj, Metadata.codec())
  }

  export function decode (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Metadata>): Metadata {
    return decodeMessage(buf, Metadata.codec(), opts)
  }

  export function stream (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Metadata>): Generator<MetadataMimeTypeFieldEvent> {
    return streamMessage(buf, Metadata.codec(), opts)
  }
}

export interface Link {
  hash?: Uint8Array<ArrayBuffer>
  name?: string
  tSize?: bigint
}

export interface LinkInput {
  hash?: Uint8Array
  name?: string
  tSize?: bigint
}

export namespace Link {
  let _codec: Codec<Link, LinkInput>

  export const codec = (): Codec<Link, LinkInput> => {
    if (_codec == null) {
      _codec = message<Link, LinkInput>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.hash != null) {
          w.uint32(10)
          w.bytes(obj.hash)
        }

        if (obj.name != null) {
          w.uint32(18)
          w.string(obj.name)
        }

        if (obj.tSize != null) {
          w.uint32(24)
          w.uint64(obj.tSize)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (r, length) => {
        const obj: any = {}

        const end = length == null ? r.len : r.pos + length

        while (r.pos < end) {
          const tag = r.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.hash = r.bytes()
              break
            }
            case 2: {
              obj.name = r.string()
              break
            }
            case 3: {
              obj.tSize = r.uint64()
              break
            }
            default: {
              r.skipType(tag & 7)
              break
            }
          }
        }

        return obj
      }, function * (r, length, prefix) {
        const end = length == null ? r.len : r.pos + length

        if (prefix !== '.') {
          yield {
            field: prefix.endsWith('.') ? prefix.substring(0, prefix.length - 1) : prefix,
            type: 'start',
            message: 'Link'
          }
        }

        while (r.pos < end) {
          const tag = r.uint32()

          switch (tag >>> 3) {
            case 1: {
              yield {
                field: `${prefix}hash`,
                value: r.bytes()
              }
              break
            }
            case 2: {
              yield {
                field: `${prefix}name`,
                value: r.string()
              }
              break
            }
            case 3: {
              yield {
                field: `${prefix}tSize`,
                value: r.uint64()
              }
              break
            }
            default: {
              r.skipType(tag & 7)
              break
            }
          }
        }

        if (prefix !== '.') {
          yield {
            field: prefix.endsWith('.') ? prefix.substring(0, prefix.length - 1) : prefix,
            type: 'end',
            message: 'Link'
          }
        }
      })
    }

    return _codec
  }

  export interface LinkHashFieldEvent {
    field: '.hash'
    value: Uint8Array<ArrayBuffer>
  }

  export interface LinkNameFieldEvent {
    field: '.name'
    value: string
  }

  export interface LinkTSizeFieldEvent {
    field: '.tSize'
    value: bigint
  }

  export function encode (obj: LinkInput): Uint8Array<ArrayBuffer> {
    return encodeMessage(obj, Link.codec())
  }

  export function decode (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Link>): Link {
    return decodeMessage(buf, Link.codec(), opts)
  }

  export function stream (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Link>): Generator<LinkHashFieldEvent | LinkNameFieldEvent | LinkTSizeFieldEvent> {
    return streamMessage(buf, Link.codec(), opts)
  }
}

export interface Node {
  data?: UnixFS
  links: Link[]
}

export interface NodeInput {
  data?: UnixFSInput
  links?: LinkInput[]
}

export namespace Node {
  let _codec: Codec<Node, NodeInput>

  export const codec = (): Codec<Node, NodeInput> => {
    if (_codec == null) {
      _codec = message<Node, NodeInput>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.data != null) {
          w.uint32(10)
          UnixFS.codec().encode(obj.data, w)
        }

        if (obj.links != null && obj.links.length > 0) {
          for (const value of obj.links) {
            w.uint32(18)
            Link.codec().encode(value, w)
          }
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (r, length, opts = {}) => {
        const obj: any = {
          links: []
        }

        const end = length == null ? r.len : r.pos + length

        while (r.pos < end) {
          const tag = r.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.data = UnixFS.codec().decode(r, r.uint32(), {
                limits: opts.limits?.data
              })
              break
            }
            case 2: {
              if (opts.limits?.links != null && obj.links.length === opts.limits.links) {
                throw new MaxLengthError('Decode error - repeated field "links" had too many elements')
              }

              obj.links.push(Link.codec().decode(r, r.uint32(), {
                limits: opts.limits?.links$
              }))
              break
            }
            default: {
              r.skipType(tag & 7)
              break
            }
          }
        }

        return obj
      }, function * (r, length, prefix, opts = {}) {
        const obj = {
          links: 0
        }

        const end = length == null ? r.len : r.pos + length

        if (prefix !== '.') {
          yield {
            field: prefix.endsWith('.') ? prefix.substring(0, prefix.length - 1) : prefix,
            type: 'start',
            message: 'Node'
          }
        }

        while (r.pos < end) {
          const tag = r.uint32()

          switch (tag >>> 3) {
            case 1: {
              yield * UnixFS.codec().stream(r, r.uint32(), `${prefix}data.`, {
                limits: opts.limits?.data
              })

              break
            }
            case 2: {
              if (opts.limits?.links != null && obj.links === opts.limits.links) {
                throw new MaxLengthError('Streaming decode error - repeated field "links" had too many elements')
              }

              for (const evt of Link.codec().stream(r, r.uint32(), `${prefix}links[].`, {
                limits: opts.limits?.links$
              })) {
                yield {
                  ...evt,
                  index: obj.links
                }
              }

              obj.links++

              break
            }
            default: {
              r.skipType(tag & 7)
              break
            }
          }
        }

        if (prefix !== '.') {
          yield {
            field: prefix.endsWith('.') ? prefix.substring(0, prefix.length - 1) : prefix,
            type: 'end',
            message: 'Node'
          }
        }
      })
    }

    return _codec
  }

  export interface NodeDataMessageStart {
    field: '.data'
    type: 'start'
  }

  export interface NodeDataMessageEnd {
    field: '.data'
    type: 'end'
  }

  export interface NodeDataTypeFieldEvent {
    field: '.data.type'
    value: UnixFS.Type
  }

  export interface NodeDataDataFieldEvent {
    field: '.data.data'
    value: Uint8Array<ArrayBuffer>
  }

  export interface NodeDataFileSizeFieldEvent {
    field: '.data.fileSize'
    value: bigint
  }

  export interface NodeDataBlockSizesFieldEvent {
    field: '.data.blockSizes[]'
    index: number
    value: bigint
  }

  export interface NodeDataHashTypeFieldEvent {
    field: '.data.hashType'
    value: bigint
  }

  export interface NodeDataFanOutFieldEvent {
    field: '.data.fanOut'
    value: bigint
  }

  export interface NodeDataModeFieldEvent {
    field: '.data.mode'
    value: number
  }

  export interface NodeDataMtimeMessageStart {
    field: '.data.mtime'
    type: 'start'
  }

  export interface NodeDataMtimeMessageEnd {
    field: '.data.mtime'
    type: 'end'
  }

  export interface NodeDataMtimeSecondsFieldEvent {
    field: '.data.mtime.seconds'
    value: bigint
  }

  export interface NodeDataMtimeFractionalNanosecondsFieldEvent {
    field: '.data.mtime.fractionalNanoseconds'
    value: number
  }

  export interface NodeLinksHashFieldEvent {
    field: '.links[].hash'
    value: Uint8Array<ArrayBuffer>
    index: number
  }

  export interface NodeLinksNameFieldEvent {
    field: '.links[].name'
    value: string
    index: number
  }

  export interface NodeLinksTSizeFieldEvent {
    field: '.links[].tSize'
    value: bigint
    index: number
  }

  export interface NodeLinksMessageStartEvent {
    field: '.links[]'
    index: number
    type: 'start'
    message: string
  }

  export interface NodeLinksMessageEndEvent {
    field: '.links[]'
    index: number
    type: 'end'
    message: string
  }

  export function encode (obj: NodeInput): Uint8Array<ArrayBuffer> {
    return encodeMessage(obj, Node.codec())
  }

  export function decode (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Node>): Node {
    return decodeMessage(buf, Node.codec(), opts)
  }

  export function stream (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Node>): Generator<NodeDataMessageStart | NodeDataMessageEnd | NodeDataTypeFieldEvent | NodeDataDataFieldEvent | NodeDataFileSizeFieldEvent | NodeDataBlockSizesFieldEvent | NodeDataHashTypeFieldEvent | NodeDataFanOutFieldEvent | NodeDataModeFieldEvent | NodeDataMtimeMessageStart | NodeDataMtimeMessageEnd | NodeDataMtimeSecondsFieldEvent | NodeDataMtimeFractionalNanosecondsFieldEvent | NodeLinksHashFieldEvent | NodeLinksNameFieldEvent | NodeLinksTSizeFieldEvent | NodeLinksMessageStartEvent | NodeLinksMessageEndEvent> {
    return streamMessage(buf, Node.codec(), opts)
  }
}

export interface LegacyNode {
  links: Link[]
  data?: UnixFS
}

export interface LegacyNodeInput {
  links?: LinkInput[]
  data?: UnixFSInput
}

export namespace LegacyNode {
  let _codec: Codec<LegacyNode, LegacyNodeInput>

  export const codec = (): Codec<LegacyNode, LegacyNodeInput> => {
    if (_codec == null) {
      _codec = message<LegacyNode, LegacyNodeInput>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.links != null && obj.links.length > 0) {
          for (const value of obj.links) {
            w.uint32(18)
            Link.codec().encode(value, w)
          }
        }

        if (obj.data != null) {
          w.uint32(10)
          UnixFS.codec().encode(obj.data, w)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (r, length, opts = {}) => {
        const obj: any = {
          links: []
        }

        const end = length == null ? r.len : r.pos + length

        while (r.pos < end) {
          const tag = r.uint32()

          switch (tag >>> 3) {
            case 2: {
              if (opts.limits?.links != null && obj.links.length === opts.limits.links) {
                throw new MaxLengthError('Decode error - repeated field "links" had too many elements')
              }

              obj.links.push(Link.codec().decode(r, r.uint32(), {
                limits: opts.limits?.links$
              }))
              break
            }
            case 1: {
              obj.data = UnixFS.codec().decode(r, r.uint32(), {
                limits: opts.limits?.data
              })
              break
            }
            default: {
              r.skipType(tag & 7)
              break
            }
          }
        }

        return obj
      }, function * (r, length, prefix, opts = {}) {
        const obj = {
          links: 0
        }

        const end = length == null ? r.len : r.pos + length

        if (prefix !== '.') {
          yield {
            field: prefix.endsWith('.') ? prefix.substring(0, prefix.length - 1) : prefix,
            type: 'start',
            message: 'LegacyNode'
          }
        }

        while (r.pos < end) {
          const tag = r.uint32()

          switch (tag >>> 3) {
            case 2: {
              if (opts.limits?.links != null && obj.links === opts.limits.links) {
                throw new MaxLengthError('Streaming decode error - repeated field "links" had too many elements')
              }

              for (const evt of Link.codec().stream(r, r.uint32(), `${prefix}links[].`, {
                limits: opts.limits?.links$
              })) {
                yield {
                  ...evt,
                  index: obj.links
                }
              }

              obj.links++

              break
            }
            case 1: {
              yield * UnixFS.codec().stream(r, r.uint32(), `${prefix}data.`, {
                limits: opts.limits?.data
              })

              break
            }
            default: {
              r.skipType(tag & 7)
              break
            }
          }
        }

        if (prefix !== '.') {
          yield {
            field: prefix.endsWith('.') ? prefix.substring(0, prefix.length - 1) : prefix,
            type: 'end',
            message: 'LegacyNode'
          }
        }
      })
    }

    return _codec
  }

  export interface LegacyNodeLinksHashFieldEvent {
    field: '.links[].hash'
    value: Uint8Array<ArrayBuffer>
    index: number
  }

  export interface LegacyNodeLinksNameFieldEvent {
    field: '.links[].name'
    value: string
    index: number
  }

  export interface LegacyNodeLinksTSizeFieldEvent {
    field: '.links[].tSize'
    value: bigint
    index: number
  }

  export interface LegacyNodeLinksMessageStartEvent {
    field: '.links[]'
    index: number
    type: 'start'
    message: string
  }

  export interface LegacyNodeLinksMessageEndEvent {
    field: '.links[]'
    index: number
    type: 'end'
    message: string
  }

  export interface LegacyNodeDataMessageStart {
    field: '.data'
    type: 'start'
  }

  export interface LegacyNodeDataMessageEnd {
    field: '.data'
    type: 'end'
  }

  export interface LegacyNodeDataTypeFieldEvent {
    field: '.data.type'
    value: UnixFS.Type
  }

  export interface LegacyNodeDataDataFieldEvent {
    field: '.data.data'
    value: Uint8Array<ArrayBuffer>
  }

  export interface LegacyNodeDataFileSizeFieldEvent {
    field: '.data.fileSize'
    value: bigint
  }

  export interface LegacyNodeDataBlockSizesFieldEvent {
    field: '.data.blockSizes[]'
    index: number
    value: bigint
  }

  export interface LegacyNodeDataHashTypeFieldEvent {
    field: '.data.hashType'
    value: bigint
  }

  export interface LegacyNodeDataFanOutFieldEvent {
    field: '.data.fanOut'
    value: bigint
  }

  export interface LegacyNodeDataModeFieldEvent {
    field: '.data.mode'
    value: number
  }

  export interface LegacyNodeDataMtimeMessageStart {
    field: '.data.mtime'
    type: 'start'
  }

  export interface LegacyNodeDataMtimeMessageEnd {
    field: '.data.mtime'
    type: 'end'
  }

  export interface LegacyNodeDataMtimeSecondsFieldEvent {
    field: '.data.mtime.seconds'
    value: bigint
  }

  export interface LegacyNodeDataMtimeFractionalNanosecondsFieldEvent {
    field: '.data.mtime.fractionalNanoseconds'
    value: number
  }

  export function encode (obj: LegacyNodeInput): Uint8Array<ArrayBuffer> {
    return encodeMessage(obj, LegacyNode.codec())
  }

  export function decode (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<LegacyNode>): LegacyNode {
    return decodeMessage(buf, LegacyNode.codec(), opts)
  }

  export function stream (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<LegacyNode>): Generator<LegacyNodeLinksHashFieldEvent | LegacyNodeLinksNameFieldEvent | LegacyNodeLinksTSizeFieldEvent | LegacyNodeLinksMessageStartEvent | LegacyNodeLinksMessageEndEvent | LegacyNodeDataMessageStart | LegacyNodeDataMessageEnd | LegacyNodeDataTypeFieldEvent | LegacyNodeDataDataFieldEvent | LegacyNodeDataFileSizeFieldEvent | LegacyNodeDataBlockSizesFieldEvent | LegacyNodeDataHashTypeFieldEvent | LegacyNodeDataFanOutFieldEvent | LegacyNodeDataModeFieldEvent | LegacyNodeDataMtimeMessageStart | LegacyNodeDataMtimeMessageEnd | LegacyNodeDataMtimeSecondsFieldEvent | LegacyNodeDataMtimeFractionalNanosecondsFieldEvent> {
    return streamMessage(buf, LegacyNode.codec(), opts)
  }
}
