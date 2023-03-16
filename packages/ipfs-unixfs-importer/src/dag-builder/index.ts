import { dirBuilder, DirBuilderOptions } from './dir.js'
import { fileBuilder, FileBuilderOptions } from './file.js'
import errCode from 'err-code'
import type { Directory, File, FileCandidate, ImportCandidate, InProgressImportResult, WritableStorage } from '../index.js'
import type { ChunkValidator } from './validate-chunks.js'
import type { Chunker } from '../chunker/index.js'

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

export interface DagBuilderOptions extends FileBuilderOptions, DirBuilderOptions {
  chunker: Chunker
  chunkValidator: ChunkValidator
  wrapWithDirectory: boolean
}

export type ImporterSourceStream = AsyncIterable<ImportCandidate> | Iterable<ImportCandidate>

export interface DAGBuilder {
  (source: ImporterSourceStream, blockstore: WritableStorage): AsyncIterable<() => Promise<InProgressImportResult>>
}

export function defaultDagBuilder (options: DagBuilderOptions): DAGBuilder {
  return async function * dagBuilder (source, blockstore) {
    for await (const entry of source) {
      let originalPath: string | undefined

      if (entry.path != null) {
        originalPath = entry.path
        entry.path = entry.path
          .split('/')
          .filter(path => path != null && path !== '.')
          .join('/')
      }

      if (isFileCandidate(entry)) {
        const file: File = {
          path: entry.path,
          mtime: entry.mtime,
          mode: entry.mode,
          content: options.chunker(options.chunkValidator(contentAsAsyncIterable(entry.content))),
          originalPath
        }

        yield async () => await fileBuilder(file, blockstore, options)
      } else if (entry.path != null) {
        const dir: Directory = {
          path: entry.path,
          mtime: entry.mtime,
          mode: entry.mode,
          originalPath
        }

        yield async () => await dirBuilder(dir, blockstore, options)
      } else {
        throw new Error('Import candidate must have content or path or both')
      }
    }
  }
}

function isFileCandidate (entry: any): entry is FileCandidate {
  return entry.content != null
}
