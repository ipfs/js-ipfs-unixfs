import all from 'it-all'

/**
 * @type {import('../../types').FileDAGBuilder}
 */
async function flat (source, reduce) {
  return reduce(await all(source))
}

export default flat
