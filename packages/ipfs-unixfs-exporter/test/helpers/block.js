'use strict'

/** @type {() => import('interface-blockstore').Blockstore} */
// @ts-expect-error no types for this deep import
const block = require('ipfs-unixfs-importer/test/helpers/block')

module.exports = block
