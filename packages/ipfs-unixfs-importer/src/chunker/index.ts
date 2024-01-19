/**
 * @packageDocumentation
 *
 * Chunker functions split an incoming stream of bytes into chunks.
 *
 * The default is a fixed-size chunker which splits them into equally sized
 * chunks though other strategies are available such as Rabin chunking.
 */

export interface Chunker { (source: AsyncIterable<Uint8Array>): AsyncIterable<Uint8Array> }

export { rabin } from './rabin.js'
export { fixedSize } from './fixed-size.js'
