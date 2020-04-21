'use strict'

const { Buffer } = require('buffer')
const importer = require('ipfs-unixfs-importer')

const SHARD_SPLIT_THRESHOLD = 10

const createShard = (numFiles, ipld) => {
  return createShardWithFileNames(numFiles, (index) => `file-${index}`, ipld)
}

const createShardWithFileNames = (numFiles, fileName, ipld) => {
  const files = new Array(numFiles).fill(0).map((_, index) => ({
    path: fileName(index),
    content: Buffer.from([0, 1, 2, 3, 4, index])
  }))

  return createShardWithFiles(files, ipld)
}

const createShardWithFiles = async (files, ipld) => {
  let last

  for await (const imported of importer(ipld, files, {
    shardSplitThreshold: SHARD_SPLIT_THRESHOLD,
    wrap: true
  })) {
    last = imported
  }

  return last.cid
}

module.exports = createShard
