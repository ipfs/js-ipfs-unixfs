import type { CID } from 'multiformats/cid'

/**
 * Returns a minimal CID-like object with the same fields as the passed CID. It
 * is not an instance of this copy's `CID` class but `CID.asCID` recognises it,
 * like a CID created by a different copy of multiformats
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
