/* eslint-env mocha */
'use strict'

// Chunkers
require('./chunker-fixed-size')
require('./chunker-rabin')

// Graph Builders
require('./builder')
require('./builder-flat')
require('./builder-balanced')
require('./builder-trickle-dag')
require('./builder-only-hash')
require('./builder-dir-sharding')

// Importer
require('./importer')
require('./importer-flush')

// Other
require('./import-export')
require('./import-export-nested-dir')
require('./hash-parity-with-go-ipfs')
require('./with-dag-api')
