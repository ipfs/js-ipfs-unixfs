/* eslint-env mocha */
'use strict'

// Chunkers
require('./chunker-fixed-size.spec')
require('./chunker-rabin.spec')
require('./chunker-rabin-browser.spec')

// Graph Builders
require('./builder.spec')
require('./builder-flat.spec')
require('./builder-balanced.spec')
require('./builder-trickle-dag.spec')
require('./builder-only-hash.spec')
require('./builder-dir-sharding.spec')

// Importer
require('./importer.spec')
require('./importer-flush.spec')

// Other
require('./import-export.spec')
require('./import-export-nested-dir.spec')
require('./hash-parity-with-go-ipfs.spec')
require('./with-dag-api.spec')
