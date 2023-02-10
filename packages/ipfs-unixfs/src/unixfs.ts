/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { enumeration, encodeMessage, decodeMessage, message } from 'protons-runtime'
import type { Codec } from 'protons-runtime'
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

        if (obj.blocksizes != null) {
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
      }, (reader, length) => {
        const obj: any = {
          blocksizes: []
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1:
              obj.Type = Data.DataType.codec().decode(reader)
              break
            case 2:
              obj.Data = reader.bytes()
              break
            case 3:
              obj.filesize = reader.uint64()
              break
            case 4:
              obj.blocksizes.push(reader.uint64())
              break
            case 5:
              obj.hashType = reader.uint64()
              break
            case 6:
              obj.fanout = reader.uint64()
              break
            case 7:
              obj.mode = reader.uint32()
              break
            case 8:
              obj.mtime = UnixTime.codec().decode(reader, reader.uint32())
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: Partial<Data>): Uint8Array => {
    return encodeMessage(obj, Data.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList): Data => {
    return decodeMessage(buf, Data.codec())
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
      }, (reader, length) => {
        const obj: any = {}

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1:
              obj.Seconds = reader.int64()
              break
            case 2:
              obj.FractionalNanoseconds = reader.fixed32()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: Partial<UnixTime>): Uint8Array => {
    return encodeMessage(obj, UnixTime.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList): UnixTime => {
    return decodeMessage(buf, UnixTime.codec())
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
      }, (reader, length) => {
        const obj: any = {}

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1:
              obj.MimeType = reader.string()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: Partial<Metadata>): Uint8Array => {
    return encodeMessage(obj, Metadata.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList): Metadata => {
    return decodeMessage(buf, Metadata.codec())
  }
}
