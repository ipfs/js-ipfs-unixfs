export = resolve;
/**
 * @type {Resolve}
 */
declare function resolve(cid: import("multiformats/cid").CID, name: string, path: string, toResolve: string[], depth: number, blockService: any, options: import("../types").ExporterOptions): Promise<import("../types").ResolveResult>;
declare namespace resolve {
    export { BlockAPI, ExporterOptions, UnixFSEntry, Resolver, Resolve };
}
type BlockAPI = import('../').BlockAPI;
type ExporterOptions = import('../types').ExporterOptions;
type UnixFSEntry = import('../types').UnixFSEntry;
type Resolver = import('../types').Resolver;
type Resolve = import('../types').Resolve;
//# sourceMappingURL=index.d.ts.map