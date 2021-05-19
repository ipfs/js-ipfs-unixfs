export = treeBuilder;
/**
 * @type {TreeBuilder}
 */
declare function treeBuilder(source: AsyncIterable<import("./types").InProgressImportResult>, block: import("./types").BlockAPI, options: import("./types").ImporterOptions): AsyncIterable<import("./types").ImportResult>;
declare namespace treeBuilder {
    export { ImportResult, InProgressImportResult, ImporterOptions, BlockAPI, TreeBuilder };
}
type ImportResult = import('./types').ImportResult;
type InProgressImportResult = import('./types').InProgressImportResult;
type ImporterOptions = import('./types').ImporterOptions;
type BlockAPI = import('./types').BlockAPI;
type TreeBuilder = (source: AsyncIterable<InProgressImportResult>, block: BlockAPI, options: ImporterOptions) => AsyncIterable<ImportResult>;
//# sourceMappingURL=tree-builder.d.ts.map