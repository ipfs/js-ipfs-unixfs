export = balanced;
/**
 * @typedef {import('../../types').FileDAGBuilder} FileDAGBuilder
 */
/**
 * @type {FileDAGBuilder}
 */
declare function balanced(source: AsyncIterable<import("../../types").InProgressImportResult> | Iterable<import("../../types").InProgressImportResult>, reduce: import("../../types").Reducer, options: import("../../types").ImporterOptions): Promise<import("../../types").InProgressImportResult>;
declare namespace balanced {
    export { FileDAGBuilder };
}
type FileDAGBuilder = import('../../types').FileDAGBuilder;
//# sourceMappingURL=balanced.d.ts.map