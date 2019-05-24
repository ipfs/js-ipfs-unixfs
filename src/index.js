'use strict'

const { superstruct } = require('superstruct')
const dagBuilder = require('./dag-builder')
const treeBuilder = require('./tree-builder')
const mh = require('multihashes')

const struct = superstruct({
  types: {
    codec: v => ['dag-pb', 'dag-cbor', 'raw'].includes(v),
    hashAlg: v => Object.keys(mh.names).includes(v),
    leafType: v => ['file', 'raw'].includes(v)
  }
})

const ChunkerOptions = struct({
  minChunkSize: 'number?',
  maxChunkSize: 'number?',
  avgChunkSize: 'number?',
  window: 'number?',
  polynomial: 'number?'
}, {
  maxChunkSize: 262144,
  avgChunkSize: 262144,
  window: 16,
  polynomial: 17437180132763653 // https://github.com/ipfs/go-ipfs-chunker/blob/d0125832512163708c0804a3cda060e21acddae4/rabin.go#L11
})

const BuilderOptions = struct({
  maxChildrenPerNode: 'number?',
  layerRepeat: 'number?'
}, {
  maxChildrenPerNode: 174,
  layerRepeat: 4
})

const Options = struct({
  chunker: struct.enum(['fixed', 'rabin']),
  rawLeaves: 'boolean?',
  hashOnly: 'boolean?',
  strategy: struct.enum(['balanced', 'flat', 'trickle']),
  reduceSingleLeafToSelf: 'boolean?',
  codec: 'codec?',
  format: 'codec?',
  hashAlg: 'hashAlg?',
  leafType: 'leafType?',
  cidVersion: 'number?',
  progress: 'function?',
  wrapWithDirectory: 'boolean?',
  shardSplitThreshold: 'number?',
  onlyHash: 'boolean?',
  chunkerOptions: ChunkerOptions,
  builderOptions: BuilderOptions,

  wrap: 'boolean?',
  pin: 'boolean?',
  recursive: 'boolean?',
  ignore: 'array?',
  hidden: 'boolean?',
  preload: 'boolean?'
}, {
  chunker: 'fixed',
  strategy: 'balanced',
  rawLeaves: false,
  reduceSingleLeafToSelf: true,
  codec: 'dag-pb',
  hashAlg: 'sha2-256',
  leafType: 'file',
  cidVersion: 0,
  progress: () => () => {},
  shardSplitThreshold: 1000
})

module.exports = async function * (source, ipld, options = {}) {
  const opts = Options(options)

  if (options.cidVersion > 0 && options.rawLeaves === undefined) {
    // if the cid version is 1 or above, use raw leaves as this is
    // what go does.
    opts.rawLeaves = true
  }

  if (options.hashAlg !== undefined && options.rawLeaves === undefined) {
    // if a non-default hash alg has been specified, use raw leaves as this is
    // what go does.
    opts.rawLeaves = true
  }

  // go-ifps trickle dag defaults to unixfs raw leaves, balanced dag defaults to file leaves
  if (options.strategy === 'trickle') {
    opts.leafType = 'raw'
    opts.reduceSingleLeafToSelf = false
  }

  if (options.format) {
    options.codec = options.format
  }

  for await (const entry of treeBuilder(dagBuilder(source, ipld, opts), ipld, opts)) {
    yield {
      cid: entry.cid,
      path: entry.path,
      unixfs: entry.unixfs,
      size: entry.size
    }
  }
}
