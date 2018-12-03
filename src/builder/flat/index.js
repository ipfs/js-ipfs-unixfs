'use strict'

const pull = require('pull-stream/pull')
const asyncMap = require('pull-stream/throughs/async-map')
const collect = require('pull-stream/sinks/collect')
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
    asyncMap(reduce),
    collect((err, roots) => {
      if (err) {
        result.end(err)
        return // early
      }
      if (roots.length === 1) {
        result.push(roots[0])
        result.end()
      } else if (roots.length > 1) {
        result.end(new Error('expected a maximum of 1 roots and got ' + roots.length))
      } else {
        result.end()
      }
    })
  )

  return {
    sink: pair.sink,
    source: result
  }
}
