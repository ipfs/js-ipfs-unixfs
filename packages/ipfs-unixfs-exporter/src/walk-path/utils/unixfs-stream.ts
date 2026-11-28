import { Node } from 'ipfs-unixfs'
import { CID } from 'multiformats/cid'
import { NotUnixFSError } from '../../errors.ts'

export interface Link {
  type: 'LINK'
  name: string
  hash: CID
}

export interface UnixFSFile {
  type: 'FILE'
}

export interface UnixFSRaw {
  type: 'RAW'
}

export interface UnixFSSymLink {
  type: 'SYMLINK'
}

export interface UnixFSDirectoryMetadata {
  type: 'DIRECTORY'
}

export interface UnixFSHAMTMetadata {
  type: 'HAMT_SHARD'
  data: Uint8Array
  hashType: number
  fanOut: number
}

export type UnixFSEntity = UnixFSDirectoryMetadata | UnixFSHAMTMetadata | UnixFSFile | UnixFSRaw | UnixFSSymLink | Link

export type UnixFSDirectory = UnixFSDirectoryMetadata | UnixFSHAMTMetadata

export function isValidUnixFSDirectoryMetadata (obj: Record<string, any>): obj is UnixFSDirectoryMetadata {
  return obj.type === 'DIRECTORY'
}

export function isValidUnixFSFile (obj: Record<string, any>): obj is UnixFSFile {
  return obj.type === 'FILE'
}

export function isValidUnixFSRaw (obj: Record<string, any>): obj is UnixFSRaw {
  return obj.type === 'RAW'
}

export function isValidUnixFSSymlink (obj: Record<string, any>): obj is UnixFSSymLink {
  return obj.type === 'SYMLINK'
}

export function isValidUnixFSHAMTMetadata (obj: Record<string, any>): obj is UnixFSHAMTMetadata {
  return obj.type === 'HAMT_SHARD' &&
    obj.data instanceof Uint8Array &&
    typeof obj.fanOut === 'bigint' &&
    typeof obj.hashType === 'bigint'
}

export function isValidLink (obj: Record<string, any>): obj is Link {
  return typeof obj.name === 'string' && CID.asCID(obj.hash) === obj.hash
}

export function * unixFsStream (block: Uint8Array): Generator<UnixFSEntity> {
  let link: Record<string, any> = {}
  let data: Record<string, any> = {}

  for (const evt of Node.stream(block)) {
    switch (evt.field) {
      case '.data': {
        if (evt.type === 'start') {
          data = {}
        }

        if (evt.type === 'end') {
          if (isValidUnixFSDirectoryMetadata(data) || isValidUnixFSHAMTMetadata(data) || isValidUnixFSFile(data) || isValidUnixFSRaw(data) || isValidUnixFSSymlink(data)) {
            yield data
            return
          }

          throw new NotUnixFSError('PBNode Data was not a valid UnixFS type')
        }

        break
      }
      case '.data.type': {
        data.type = evt.value
        break
      }
      case '.data.data': {
        data.data = evt.value
        break
      }
      case '.data.fanOut': {
        data.fanOut = evt.value
        break
      }
      case '.data.hashType': {
        data.hashType = evt.value
        break
      }

      case '.links[]': {
        if (evt.type === 'start') {
          link = {
            type: 'LINK'
          }
        }

        if (evt.type === 'end' && isValidLink(link)) {
          yield link
        }

        break
      }
      case '.links[].name': {
        link.name = evt.value
        break
      }
      case '.links[].hash': {
        link.hash = CID.decode(evt.value)
        break
      }
      default:
    }
  }
}
