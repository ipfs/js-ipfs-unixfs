export = validateChunks;
/**
 * @typedef {import('../types').ChunkValidator} ChunkValidator
 */
/**
 * @type {ChunkValidator}
 */
declare function validateChunks(source: AsyncIterable<Uint8Array>): AsyncIterable<Uint8Array>;
declare namespace validateChunks {
    export { ChunkValidator };
}
type ChunkValidator = import('../types').ChunkValidator;
//# sourceMappingURL=validate-chunks.d.ts.map