import { decodeMessage, encodeMessage, enumeration, MaxLengthError, message, streamMessage } from 'protons-runtime'
import type { Codec, DecodeOptions } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface Data {
  Type?: Data.DataType
  Data?: Uint8Array
  filesize?: bigint
  blocksizes: bigint[]
  hashType?: bigint
  fanout?: bigint
  mode?: number
  mtime?: UnixTime
}

export namespace Data {
  export enum DataType {
    Raw = 'Raw',
    Directory = 'Directory',
    File = 'File',
    Metadata = 'Metadata',
    Symlink = 'Symlink',
    HAMTShard = 'HAMTShard'
  }

  enum __DataTypeValues {
    Raw = 0,
    Directory = 1,
    File = 2,
    Metadata = 3,
    Symlink = 4,
    HAMTShard = 5
  }

  export namespace DataType {
    export const codec = (): Codec<DataType> => {
      return enumeration<DataType>(__DataTypeValues)
    }
  }

  let _codec: Codec<Data>

  export const codec = (): Codec<Data> => {
    if (_codec == null) {
      _codec = message<Data>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.Type != null) {
          w.uint32(8)
          Data.DataType.codec().encode(obj.Type, w)
        }

        if (obj.Data != null) {
          w.uint32(18)
          w.bytes(obj.Data)
        }

        if (obj.filesize != null) {
          w.uint32(24)
          w.uint64(obj.filesize)
        }

        if (obj.blocksizes != null && obj.blocksizes.length > 0) {
          for (const value of obj.blocksizes) {
            w.uint32(32)
            w.uint64(value)
          }
        }

        if (obj.hashType != null) {
          w.uint32(40)
          w.uint64(obj.hashType)
        }

        if (obj.fanout != null) {
          w.uint32(48)
          w.uint64(obj.fanout)
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
      }, (reader, length, opts = {}) => {
        const obj: any = {
          blocksizes: []
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.Type = Data.DataType.codec().decode(reader)
              break
            }
            case 2: {
              obj.Data = reader.bytes()
              break
            }
            case 3: {
              obj.filesize = reader.uint64()
              break
            }
            case 4: {
              if (opts.limits?.blocksizes != null && obj.blocksizes.length === opts.limits.blocksizes) {
                throw new MaxLengthError('Decode error - repeated field "blocksizes" had too many elements')
              }

              obj.blocksizes.push(reader.uint64())
              break
            }
            case 5: {
              obj.hashType = reader.uint64()
              break
            }
            case 6: {
              obj.fanout = reader.uint64()
              break
            }
            case 7: {
              obj.mode = reader.uint32()
              break
            }
            case 8: {
              obj.mtime = UnixTime.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.mtime
              })
              break
            }
            default: {
              reader.skipType(tag & 7)
              break
            }
          }
        }

        return obj
      }, function * (reader, length, prefix, opts = {}) {
        const obj = {
          blocksizes: 0
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              yield {
                field: `${prefix}.Type`,
                value: Data.DataType.codec().decode(reader)
              }
              break
            }
            case 2: {
              yield {
                field: `${prefix}.Data`,
                value: reader.bytes()
              }
              break
            }
            case 3: {
              yield {
                field: `${prefix}.filesize`,
                value: reader.uint64()
              }
              break
            }
            case 4: {
              if (opts.limits?.blocksizes != null && obj.blocksizes === opts.limits.blocksizes) {
                throw new MaxLengthError('Streaming decode error - repeated field "blocksizes" had too many elements')
              }

              yield {
                field: `${prefix}.blocksizes[]`,
                index: obj.blocksizes,
                value: reader.uint64()
              }

              obj.blocksizes++

              break
            }
            case 5: {
              yield {
                field: `${prefix}.hashType`,
                value: reader.uint64()
              }
              break
            }
            case 6: {
              yield {
                field: `${prefix}.fanout`,
                value: reader.uint64()
              }
              break
            }
            case 7: {
              yield {
                field: `${prefix}.mode`,
                value: reader.uint32()
              }
              break
            }
            case 8: {
              yield * UnixTime.codec().stream(reader, reader.uint32(), `${prefix}.mtime`, {
                limits: opts.limits?.mtime
              })

              break
            }
            default: {
              reader.skipType(tag & 7)
              break
            }
          }
        }
      })
    }

    return _codec
  }

  export interface DataTypeFieldEvent {
    field: '$.Type'
    value: Data.DataType
  }

  export interface DataDataFieldEvent {
    field: '$.Data'
    value: Uint8Array
  }

  export interface DataFilesizeFieldEvent {
    field: '$.filesize'
    value: bigint
  }

  export interface DataBlocksizesFieldEvent {
    field: '$.blocksizes[]'
    index: number
    value: bigint
  }

  export interface DataHashTypeFieldEvent {
    field: '$.hashType'
    value: bigint
  }

  export interface DataFanoutFieldEvent {
    field: '$.fanout'
    value: bigint
  }

  export interface DataModeFieldEvent {
    field: '$.mode'
    value: number
  }

  export interface DataMtimeSecondsFieldEvent {
    field: '$.mtime.Seconds'
    value: bigint
  }

  export interface DataMtimeFractionalNanosecondsFieldEvent {
    field: '$.mtime.FractionalNanoseconds'
    value: number
  }

  export function encode (obj: Partial<Data>): Uint8Array {
    return encodeMessage(obj, Data.codec())
  }

  export function decode (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Data>): Data {
    return decodeMessage(buf, Data.codec(), opts)
  }

  export function stream (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Data>): Generator<DataTypeFieldEvent | DataDataFieldEvent | DataFilesizeFieldEvent | DataBlocksizesFieldEvent | DataHashTypeFieldEvent | DataFanoutFieldEvent | DataModeFieldEvent | DataMtimeSecondsFieldEvent | DataMtimeFractionalNanosecondsFieldEvent> {
    return streamMessage(buf, Data.codec(), opts)
  }
}

export interface UnixTime {
  Seconds?: bigint
  FractionalNanoseconds?: number
}

export namespace UnixTime {
  let _codec: Codec<UnixTime>

  export const codec = (): Codec<UnixTime> => {
    if (_codec == null) {
      _codec = message<UnixTime>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.Seconds != null) {
          w.uint32(8)
          w.int64(obj.Seconds)
        }

        if (obj.FractionalNanoseconds != null) {
          w.uint32(21)
          w.fixed32(obj.FractionalNanoseconds)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {}

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.Seconds = reader.int64()
              break
            }
            case 2: {
              obj.FractionalNanoseconds = reader.fixed32()
              break
            }
            default: {
              reader.skipType(tag & 7)
              break
            }
          }
        }

        return obj
      }, function * (reader, length, prefix, opts = {}) {
        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              yield {
                field: `${prefix}.Seconds`,
                value: reader.int64()
              }
              break
            }
            case 2: {
              yield {
                field: `${prefix}.FractionalNanoseconds`,
                value: reader.fixed32()
              }
              break
            }
            default: {
              reader.skipType(tag & 7)
              break
            }
          }
        }
      })
    }

    return _codec
  }

  export interface UnixTimeSecondsFieldEvent {
    field: '$.Seconds'
    value: bigint
  }

  export interface UnixTimeFractionalNanosecondsFieldEvent {
    field: '$.FractionalNanoseconds'
    value: number
  }

  export function encode (obj: Partial<UnixTime>): Uint8Array {
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
  MimeType?: string
}

export namespace Metadata {
  let _codec: Codec<Metadata>

  export const codec = (): Codec<Metadata> => {
    if (_codec == null) {
      _codec = message<Metadata>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.MimeType != null) {
          w.uint32(10)
          w.string(obj.MimeType)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length, opts = {}) => {
        const obj: any = {}

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              obj.MimeType = reader.string()
              break
            }
            default: {
              reader.skipType(tag & 7)
              break
            }
          }
        }

        return obj
      }, function * (reader, length, prefix, opts = {}) {
        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1: {
              yield {
                field: `${prefix}.MimeType`,
                value: reader.string()
              }
              break
            }
            default: {
              reader.skipType(tag & 7)
              break
            }
          }
        }
      })
    }

    return _codec
  }

  export interface MetadataMimeTypeFieldEvent {
    field: '$.MimeType'
    value: string
  }

  export function encode (obj: Partial<Metadata>): Uint8Array {
    return encodeMessage(obj, Metadata.codec())
  }

  export function decode (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Metadata>): Metadata {
    return decodeMessage(buf, Metadata.codec(), opts)
  }

  export function stream (buf: Uint8Array | Uint8ArrayList, opts?: DecodeOptions<Metadata>): Generator<MetadataMimeTypeFieldEvent> {
    return streamMessage(buf, Metadata.codec(), opts)
  }
}
