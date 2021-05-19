export = dagBuilder;
/**
 * @type {DAGBuilder}
 */
declare function dagBuilder(source: AsyncIterable<import("../types").ImportCandidate> | Iterable<import("../types").ImportCandidate>, block: import("../types").BlockAPI, options: import("../types").ImporterOptions): AsyncIterable<() => Promise<import("../types").InProgressImportResult>>;
declare namespace dagBuilder {
    export { File, Directory, DAGBuilder, Chunker, ChunkValidator };
}
type File = import('../types').File;
type Directory = import('../types').Directory;
type DAGBuilder = import('../types').DAGBuilder;
type Chunker = import('../types').Chunker;
type ChunkValidator = import('../types').ChunkValidator;
//# sourceMappingURL=index.d.ts.map