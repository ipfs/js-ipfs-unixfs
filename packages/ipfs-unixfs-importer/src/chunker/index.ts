
export interface Chunker { (source: AsyncIterable<Uint8Array>): AsyncIterable<Uint8Array> }

export { rabin } from './rabin.js'
export { fixedSize } from './fixed-size.js'
