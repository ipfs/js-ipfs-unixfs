export = persist;
/**
 * @param {Uint8Array} buffer
 * @param {import('../types').BlockAPI} block
 * @param {import('../types').PersistOptions} options
 */
declare function persist(buffer: Uint8Array, block: import('../types').BlockAPI, options: import('../types').PersistOptions): Promise<CID>;
import { CID } from "multiformats/cid";
//# sourceMappingURL=persist.d.ts.map