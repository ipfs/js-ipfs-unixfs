import type { InProgressImportResult } from '../index.js'

export interface Reducer { (leaves: InProgressImportResult[]): Promise<InProgressImportResult> }
export interface FileLayout { (source: AsyncIterable<InProgressImportResult> | Iterable<InProgressImportResult>, reducer: Reducer): Promise<InProgressImportResult> }

export { balanced } from './balanced.js'
export { flat } from './flat.js'
export { trickle } from './trickle.js'
