'use strict'

const assert = require('assert')
const pull = require('pull-stream')
const pushable = require('pull-pushable')
const pullPair = require('pull-pair')
const batch = require('pull-batch')

module.exports = function (reduce, options) {
  const pair = pullPair()
  const source = pair.source
  const result = pushable()

  pull(
    source,
    batch(Infinity),
    pull.asyncMap(reduce),
    pull.collect((err, roots) => {
      if (err) {
        result.end(err)
        return // early
      }
      assert.equal(roots.length, 1, 'need one root')
      result.push(roots[0])
      result.end()
    })
  )

  return {
    sink: pair.sink,
    source: result
  }
}
