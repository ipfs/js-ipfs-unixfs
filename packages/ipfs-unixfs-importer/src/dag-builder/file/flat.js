'use strict'

const all = require('it-all')

/**
 * @type {import('./').DAGBuilder}
 */
module.exports = async function * (source, reduce) {
  yield await reduce(await all(source))
}
