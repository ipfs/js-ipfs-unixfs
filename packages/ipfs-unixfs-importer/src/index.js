'use strict'

const parallelBatch = require('it-parallel-batch')
const mergeOptions = require('merge-options').bind({ ignoreUndefined: true })

const defaultOptions = {
  chunker: 'fixed',
  strategy: 'balanced', // 'flat', 'trickle'
  rawLeaves: false,
  onlyHash: false,
  reduceSingleLeafToSelf: true,
  codec: 'dag-pb',
  hashAlg: 'sha2-256',
  leafType: 'file', // 'raw'
  cidVersion: 0,
  progress: () => () => {},
  shardSplitThreshold: 1000,
  fileImportConcurrency: 50,
  blockWriteConcurrency: 10,
  minChunkSize: 262144,
  maxChunkSize: 262144,
  avgChunkSize: 262144,
  window: 16,
  polynomial: 17437180132763653, // https://github.com/ipfs/go-ipfs-chunker/blob/d0125832512163708c0804a3cda060e21acddae4/rabin.go#L11
  maxChildrenPerNode: 174,
  layerRepeat: 4,
  wrapWithDirectory: false,
  pin: false,
  recursive: false,
  hidden: false,
  preload: false,
  chunkValidator: null,
  importBuffer: null
}

module.exports = async function * (source, block, options = {}) {
  const opts = mergeOptions(defaultOptions, options)

  let dagBuilder

  if (typeof options.dagBuilder === 'function') {
    dagBuilder = options.dagBuilder
  } else {
    dagBuilder = require('./dag-builder')
  }

  let treeBuilder

  if (typeof options.treeBuilder === 'function') {
    treeBuilder = options.treeBuilder
  } else {
    treeBuilder = require('./tree-builder')
  }

  for await (const entry of treeBuilder(parallelBatch(dagBuilder(source, block, opts), opts.fileImportConcurrency), block, opts)) {
    yield {
      cid: entry.cid,
      path: entry.path,
      unixfs: entry.unixfs,
      size: entry.size
    }
  }
}
