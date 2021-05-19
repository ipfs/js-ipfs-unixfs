export = hamtShardedDirectoryContent;
/**
 * @typedef {import('ipfs-unixfs-importer/src/types').BlockAPI} BlockAPI
 * @typedef {import('../../../types').ExporterOptions} ExporterOptions
 * @typedef {import('../../../types').Resolve} Resolve
 * @typedef {import('../../../types').UnixfsV1DirectoryContent} UnixfsV1DirectoryContent
 * @typedef {import('../../../types').UnixfsV1Resolver} UnixfsV1Resolver
 * @typedef {import('@ipld/dag-pb').PBNode} PBNode
 */
/**
 * @type {UnixfsV1Resolver}
 */
declare const hamtShardedDirectoryContent: UnixfsV1Resolver;
declare namespace hamtShardedDirectoryContent {
    export { BlockAPI, ExporterOptions, Resolve, UnixfsV1DirectoryContent, UnixfsV1Resolver, PBNode };
}
type UnixfsV1Resolver = import('../../../types').UnixfsV1Resolver;
type BlockAPI = import('ipfs-unixfs-importer/src/types').BlockAPI;
type ExporterOptions = import('../../../types').ExporterOptions;
type Resolve = import('../../../types').Resolve;
type UnixfsV1DirectoryContent = import('../../../types').UnixfsV1DirectoryContent;
type PBNode = import('@ipld/dag-pb').PBNode;
//# sourceMappingURL=hamt-sharded-directory.d.ts.map