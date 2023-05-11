import all from 'it-all'
import type { FileLayout } from './index.js'
import type { InProgressImportResult } from '../index.js'

export function flat (): FileLayout {
  return async function flatLayout (source, reduce): Promise<InProgressImportResult> {
    return reduce(await all(source))
  }
}
