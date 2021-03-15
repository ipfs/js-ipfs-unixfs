'use strict'

const all = require('it-all')

/**
 * @type {import('../../types').FileDAGBuilder}
 */
module.exports = async function (source, reduce) {
  return reduce(await all(source))
}
