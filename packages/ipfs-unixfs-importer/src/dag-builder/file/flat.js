'use strict'

const all = require('it-all')

module.exports = async function * (source, reduce) {
  yield await reduce(await all(source))
}
