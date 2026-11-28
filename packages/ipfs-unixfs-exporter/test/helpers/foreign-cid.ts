import type { CID } from 'multiformats/cid'

/**
 * Returns a copy of the passed CID that is not an instance of this copy of the
 * `CID` class, the same as a CID created by a different copy of multiformats
 */
export function foreignCID (cid: CID): CID {
  const foreign: any = {
    version: cid.version,
    code: cid.code,
    multihash: cid.multihash,
    bytes: cid.bytes,
    '/': cid.bytes,
    toString: () => cid.toString()
  }

  return foreign
}
