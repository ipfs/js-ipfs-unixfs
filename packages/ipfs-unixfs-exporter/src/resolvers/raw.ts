import errCode from 'err-code'
import type { ExporterOptions, Resolver } from '../index.js'
import extractDataFromBlock from '../utils/extract-data-from-block.js'
import validateOffsetAndLength from '../utils/validate-offset-and-length.js'

const rawContent = (node: Uint8Array): ((options?: ExporterOptions) => AsyncGenerator<Uint8Array, void, undefined>) => {
  async function * contentGenerator (options: ExporterOptions = {}): AsyncGenerator<Uint8Array, void, undefined> {
    const {
      offset,
      length
    } = validateOffsetAndLength(node.length, options.offset, options.length)

    yield extractDataFromBlock(node, 0n, offset, offset + length)
  }

  return contentGenerator
}

const resolve: Resolver = async (cid, name, path, toResolve, resolve, depth, blockstore, options) => {
  if (toResolve.length > 0) {
    throw errCode(new Error(`No link named ${path} found in raw node ${cid}`), 'ERR_NOT_FOUND')
  }

  const block = await blockstore.get(cid, options)

  return {
    entry: {
      type: 'raw',
      name,
      path,
      cid,
      content: rawContent(block),
      depth,
      size: BigInt(block.length),
      node: block
    }
  }
}

export default resolve
