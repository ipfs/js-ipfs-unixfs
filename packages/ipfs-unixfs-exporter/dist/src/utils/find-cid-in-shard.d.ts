export = findShardCid;
/**
 * @typedef {object} ShardTraversalContext
 * @property {number} hamtDepth
 * @property {Bucket<boolean>} rootBucket
 * @property {Bucket<boolean>} lastBucket
 *
 * @param {PBNode} node
 * @param {string} name
 * @param {BlockService} blockService
 * @param {ShardTraversalContext} [context]
 * @param {ExporterOptions} [options]
 * @returns {Promise<CID|null>}
 */
declare function findShardCid(node: PBNode, name: string, blockService: BlockService, context?: ShardTraversalContext | undefined, options?: import("../types").ExporterOptions | undefined): Promise<CID | null>;
declare namespace findShardCid {
    export { BlockService, CID, ExporterOptions, PBNode, PBLink, ShardTraversalContext };
}
type PBNode = import('@ipld/dag-pb').PBNode;
type BlockService = import('ipfs-unixfs-importer/src/types').BlockAPI;
type ShardTraversalContext = {
    hamtDepth: number;
    rootBucket: Bucket<boolean>;
    lastBucket: Bucket<boolean>;
};
type CID = import('multiformats/cid').CID;
type ExporterOptions = import('../types').ExporterOptions;
type PBLink = import('@ipld/dag-pb').PBLink;
import { Bucket } from "hamt-sharding";
//# sourceMappingURL=find-cid-in-shard.d.ts.map