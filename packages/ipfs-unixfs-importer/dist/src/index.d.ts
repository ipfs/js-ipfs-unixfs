export type BlockAPI = import('./types').BlockAPI;
export type ImportCandidate = import('./types').ImportCandidate;
export type UserImporterOptions = import('./types').UserImporterOptions;
export type ImporterOptions = import('./types').ImporterOptions;
export type Directory = import('./types').Directory;
export type File = import('./types').File;
export type ImportResult = import('./types').ImportResult;
export type Chunker = import('./types').Chunker;
export type DAGBuilder = import('./types').DAGBuilder;
export type TreeBuilder = import('./types').TreeBuilder;
export type BufferImporter = import('./types').BufferImporter;
export type ChunkValidator = import('./types').ChunkValidator;
export type Reducer = import('./types').Reducer;
export type ProgressHandler = import('./types').ProgressHandler;
/**
 * @typedef {import('./types').BlockAPI} BlockAPI
 * @typedef {import('./types').ImportCandidate} ImportCandidate
 * @typedef {import('./types').UserImporterOptions} UserImporterOptions
 * @typedef {import('./types').ImporterOptions} ImporterOptions
 * @typedef {import('./types').Directory} Directory
 * @typedef {import('./types').File} File
 * @typedef {import('./types').ImportResult} ImportResult
 *
 * @typedef {import('./types').Chunker} Chunker
 * @typedef {import('./types').DAGBuilder} DAGBuilder
 * @typedef {import('./types').TreeBuilder} TreeBuilder
 * @typedef {import('./types').BufferImporter} BufferImporter
 * @typedef {import('./types').ChunkValidator} ChunkValidator
 * @typedef {import('./types').Reducer} Reducer
 * @typedef {import('./types').ProgressHandler} ProgressHandler
 */
/**
 * @param {AsyncIterable<ImportCandidate> | Iterable<ImportCandidate> | ImportCandidate} source
 * @param {BlockAPI} block
 * @param {UserImporterOptions} options
 */
export function importer(source: AsyncIterable<ImportCandidate> | Iterable<ImportCandidate> | ImportCandidate, block: BlockAPI, options?: UserImporterOptions): AsyncGenerator<{
    cid: import("multiformats/cid").CID;
    path: string | undefined;
    unixfs: import("ipfs-unixfs").UnixFS | undefined;
    size: number;
}, void, unknown>;
//# sourceMappingURL=index.d.ts.map