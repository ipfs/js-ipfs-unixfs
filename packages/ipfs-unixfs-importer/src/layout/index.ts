/**
 * @packageDocumentation
 *
 * Layout functions allow customising the shape of final DAGs
 *
 * {@link https://dag.ipfs.tech} can be used to explore different conigurations.
 */

import type { InProgressImportResult } from '../index.js'

export interface Reducer { (leaves: InProgressImportResult[]): Promise<InProgressImportResult> }
export interface FileLayout { (source: AsyncIterable<InProgressImportResult> | Iterable<InProgressImportResult>, reducer: Reducer): Promise<InProgressImportResult> }

export { balanced } from './balanced.ts'
export { flat } from './flat.ts'
export { trickle } from './trickle.ts'
