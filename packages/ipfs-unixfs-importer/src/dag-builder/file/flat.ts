import all from 'it-all'
import type { FileDAGBuilder } from '../../index.js'

export const flat: FileDAGBuilder = async function (source, reduce) {
  return await reduce(await all(source))
}
