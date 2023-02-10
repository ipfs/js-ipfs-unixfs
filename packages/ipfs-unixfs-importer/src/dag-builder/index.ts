import { dirBuilder } from './dir.js'
import { fileBuilder } from './file/index.js'
import errCode from 'err-code'
import { rabin } from '../chunker/rabin.js'
import { fixedSize } from '../chunker/fixed-size.js'
import { validateChunks } from './validate-chunks.js'
import type { Chunker, ChunkValidator, DAGBuilder, Directory, File } from '../index.js'

function isIterable (thing: any): thing is Iterable<any> {
  return Symbol.iterator in thing
}

function isAsyncIterable (thing: any): thing is AsyncIterable<any> {
  return Symbol.asyncIterator in thing
}

function contentAsAsyncIterable (content: Uint8Array | AsyncIterable<Uint8Array> | Iterable<Uint8Array>): AsyncIterable<Uint8Array> {
  try {
    if (content instanceof Uint8Array) {
      return (async function * () {
        yield content
      }())
    } else if (isIterable(content)) {
      return (async function * () {
        yield * content
      }())
    } else if (isAsyncIterable(content)) {
      return content
    }
  } catch {
    throw errCode(new Error('Content was invalid'), 'ERR_INVALID_CONTENT')
  }

  throw errCode(new Error('Content was invalid'), 'ERR_INVALID_CONTENT')
}

export const dagBuilder: DAGBuilder = async function * (source, blockstore, options) {
  for await (const entry of source) {
    if (entry.path != null) {
      if (entry.path.substring(0, 2) === './') {
        options.wrapWithDirectory = true
      }

      entry.path = entry.path
        .split('/')
        .filter(path => path != null && path !== '.')
        .join('/')
    }

    if (entry.content != null) {
      let chunker: Chunker

      if (typeof options.chunker === 'function') {
        chunker = options.chunker
      } else if (options.chunker === 'rabin') {
        chunker = rabin
      } else {
        chunker = fixedSize
      }

      let chunkValidator: ChunkValidator

      if (typeof options.chunkValidator === 'function') {
        chunkValidator = options.chunkValidator
      } else {
        chunkValidator = validateChunks
      }

      const file: File = {
        path: entry.path,
        mtime: entry.mtime,
        mode: entry.mode,
        content: chunker(chunkValidator(contentAsAsyncIterable(entry.content), options), options)
      }

      yield async () => await fileBuilder(file, blockstore, options)
    } else if (entry.path != null) {
      const dir: Directory = {
        path: entry.path,
        mtime: entry.mtime,
        mode: entry.mode
      }

      yield async () => await dirBuilder(dir, blockstore, options)
    } else {
      throw new Error('Import candidate must have content or path or both')
    }
  }
}
