'use strict'

const batch = require('async-iterator-batch')

module.exports = async function * (source, reduce) {
  const roots = []

  for await (const chunk of batch(source, Infinity)) {
    roots.push(await reduce(chunk))
  }

  yield roots[0]
}
