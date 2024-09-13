import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { InvalidContentError } from '../errors.js'

export interface ChunkValidator { (source: AsyncIterable<Uint8Array>): AsyncIterable<Uint8Array> }

export const defaultChunkValidator = (): ChunkValidator => {
  return async function * validateChunks (source) {
    for await (const content of source) {
      if (content.length === undefined) {
        throw new InvalidContentError('Content was invalid')
      }

      if (typeof content === 'string' || content instanceof String) {
        yield uint8ArrayFromString(content.toString())
      } else if (Array.isArray(content)) {
        yield Uint8Array.from(content)
      } else if (content instanceof Uint8Array) {
        yield content
      } else {
        throw new InvalidContentError('Content was invalid')
      }
    }
  }
}
