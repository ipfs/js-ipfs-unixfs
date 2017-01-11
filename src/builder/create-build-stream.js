'use strict'

const pullPushable = require('pull-pushable')
const pullWrite = require('pull-write')

module.exports = function createBuildStream (createStrategy, ipldResolver, flushTree, options) {
  const files = []

  const source = pullPushable()

  const sink = pullWrite(
    createStrategy(source, files),
    null,
    options.highWaterMark,
    (err) => {
      if (err) {
        source.end(err)
        return // early
      }

      flushTree(files, ipldResolver, source, source.end)
    }
  )

  return {
    source: source,
    sink: sink
  }
}
