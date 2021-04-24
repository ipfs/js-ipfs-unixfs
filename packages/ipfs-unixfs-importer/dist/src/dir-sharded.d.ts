export = DirSharded;
/**
 * @typedef {import('./types').ImporterOptions} ImporterOptions
 * @typedef {import('./types').ImportResult} ImportResult
 * @typedef {import('./types').InProgressImportResult} InProgressImportResult
 * @typedef {import('./types').BlockAPI} BlockAPI
 */
/**
 * @typedef {import('./dir').DirProps} DirProps
 */
declare class DirSharded extends Dir {
    /** @type {Bucket<InProgressImportResult | Dir>} */
    _bucket: Bucket<InProgressImportResult | Dir>;
    childCount(): number;
    directChildrenCount(): number;
    onlyChild(): Bucket<import("./types").InProgressImportResult | Dir> | Bucket.BucketChild<import("./types").InProgressImportResult | Dir>;
}
declare namespace DirSharded {
    export { ImporterOptions, ImportResult, InProgressImportResult, BlockAPI, DirProps };
}
import Dir = require("./dir");
import { Bucket } from "hamt-sharding";
type InProgressImportResult = import('./types').InProgressImportResult;
type ImporterOptions = import('./types').ImporterOptions;
type ImportResult = import('./types').ImportResult;
type BlockAPI = import('./types').BlockAPI;
type DirProps = import('./dir').DirProps;
//# sourceMappingURL=dir-sharded.d.ts.map