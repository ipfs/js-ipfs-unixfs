export = fileBuilder;
/**
 * @type {import('../../types').UnixFSV1DagBuilder<File>}
 */
declare function fileBuilder(file: import("../../types").File, block: import("../../types").BlockAPI, options: import("../../types").ImporterOptions): Promise<import("../../types").InProgressImportResult>;
declare namespace fileBuilder {
    export { BlockAPI, File, ImporterOptions, Reducer, DAGBuilder, FileDAGBuilder };
}
type BlockAPI = import('../../types').BlockAPI;
type File = import('../../types').File;
type ImporterOptions = import('../../types').ImporterOptions;
type Reducer = import('../../types').Reducer;
type DAGBuilder = import('../../types').DAGBuilder;
type FileDAGBuilder = import('../../types').FileDAGBuilder;
//# sourceMappingURL=index.d.ts.map