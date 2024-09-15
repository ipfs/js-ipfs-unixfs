import { chai } from 'aegir/chai'
import { MemoryBlockstore } from 'blockstore-core'
import { defaultDirBuilder, type DirBuilder } from '../src/dag-builder/dir.js'
import {
  defaultFileBuilder,
  type FileBuilder
} from '../src/dag-builder/file.js'
import { importer } from '../src/index.js'

describe('CustomParamsDagBuilder', () => {
  it('should build a dag with custom dir builder', async () => {
    const counter = { dirCounter: 0, fileCounter: 0 }
    const customDirBuilder: DirBuilder = async (...args) => {
      counter.dirCounter++
      return defaultDirBuilder(...args)
    }

    const customFileBuilder: FileBuilder = async (...args) => {
      counter.fileCounter++
      return defaultFileBuilder(...args)
    }

    const blockstore = new MemoryBlockstore()
    const files = []
    for await (const file of importer(
      [
        {
          path: './src/file.txt',
          content: new Uint8Array(
            'hello world'.split('').map((char) => char.charCodeAt(0))
          )
        },
        {
          path: './src'
        }
      ],
      blockstore,
      {
        dirBuilder: customDirBuilder,
        fileBuilder: customFileBuilder
      }
    )) {
      files.push(file)
    }

    chai.expect(counter.dirCounter).to.equal(1)
  })
})
