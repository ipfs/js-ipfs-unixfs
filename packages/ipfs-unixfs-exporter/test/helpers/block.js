/** @type {() => import('interface-blockstore').Blockstore} */
// @ts-expect-error no types for this deep import
import block from 'ipfs-unixfs-importer/test/helpers/block.js'

export default block
