export = DirFlat;
/**
 * @typedef {import('./types').ImporterOptions} ImporterOptions
 * @typedef {import('./types').ImportResult} ImportResult
 * @typedef {import('./types').InProgressImportResult} InProgressImportResult
 * @typedef {import('./types').BlockAPI} BlockAPI
 * @typedef {import('./dir').DirProps} DirProps
 * @typedef {import('@ipld/dag-pb').PBNode} PBNode
 * @typedef {import('@ipld/dag-pb').PBLink} PBLink
 */
declare class DirFlat extends Dir {
    /** @type {{ [key: string]: InProgressImportResult | Dir }} */
    _children: {
        [key: string]: import("./types").InProgressImportResult | Dir;
    };
    childCount(): number;
    directChildrenCount(): number;
    onlyChild(): import("./types").InProgressImportResult | Dir;
}
declare namespace DirFlat {
    export { ImporterOptions, ImportResult, InProgressImportResult, BlockAPI, DirProps, PBNode, PBLink };
}
import Dir = require("./dir");
type ImporterOptions = import('./types').ImporterOptions;
type ImportResult = import('./types').ImportResult;
type InProgressImportResult = import('./types').InProgressImportResult;
type BlockAPI = import('./types').BlockAPI;
type DirProps = import('./dir').DirProps;
type PBNode = import('@ipld/dag-pb').PBNode;
type PBLink = import('@ipld/dag-pb').PBLink;
//# sourceMappingURL=dir-flat.d.ts.map