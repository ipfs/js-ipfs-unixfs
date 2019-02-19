# ipfs-unixfs-importer

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Build Status](https://flat.badgen.net/travis/ipfs/js-ipfs-unixfs-importer)](https://travis-ci.com/ipfs/js-ipfs-unixfs-importer)
[![Codecov](https://codecov.io/gh/ipfs/js-ipfs-unixfs-importer/branch/master/graph/badge.svg)](https://codecov.io/gh/ipfs/js-ipfs-unixfs-importer)
[![Dependency Status](https://david-dm.org/ipfs/js-ipfs-unixfs-importer.svg?style=flat-square)](https://david-dm.org/ipfs/js-ipfs-unixfs-importer)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D3.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D8.0.0-orange.svg?style=flat-square)

> JavaScript implementation of the layout and chunking mechanisms used by IPFS to handle Files

## Lead Maintainer

[Alex Potsides](https://github.com/achingbrain)

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Example](#example)
  - [API](#api)
    - [const add = importer(dag, options)](#const-import--importerdag--options)
- [Contribute](#contribute)
- [License](#license)

## Install

```
> npm install ipfs-unixfs-importer
```

## Usage

### Example

Let's create a little directory to import:

```sh
> cd /tmp
> mkdir foo
> echo 'hello' > foo/bar
> echo 'world' > foo/quux
```

And write the importing logic:

```js
const importer = require('ipfs-unixfs-importer')
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const collect = require('pull-stream/sinks/collect')

// Import path /tmp/foo/bar
pull(
  values([{
    path: '/tmp/foo/bar',
    content: fs.createReadStream(file)
  }, {
    path: '/tmp/foo/quxx',
    content: fs.createReadStream(file2)
  }
  }]),

  // You need to create and pass an ipld-resolve instance
  // https://github.com/ipld/js-ipld-resolver
  importer(<ipld-resolver instance>, <options>),

  // Handle the error and do something with the results
  collect((err, files) => {
    console.info(files)
  })
)
```

When run, the stat of DAGNode is outputted for each file on data event until the root:

```js
{ multihash: <Buffer 12 20 bd e2 2b 57 3f 6f bd 7c cc 5a 11 7f 28 6c a2 9a 9f c0 90 e1 d4 16 d0 5f 42 81 ec 0c 2a 7f 7f 93>,
  size: 39243,
  path: '/tmp/foo/bar' }

{ multihash: <Buffer 12 20 bd e2 2b 57 3f 6f bd 7c cc 5a 11 7f 28 6c a2 9a 9f c0 90 e1 d4 16 d0 5f 42 81 ec 0c 2a 7f 7f 93>,
  size: 59843,
  path: '/tmp/foo/quxx' }

{ multihash: <Buffer 12 20 bd e2 2b 57 3f 6f bd 7c cc 5a 11 7f 28 6c a2 9a 9f c0 90 e1 d4 16 d0 5f 42 81 ec 0c 2a 7f 7f 93>,
  size: 93242,
  path: '/tmp/foo' }

{ multihash: <Buffer 12 20 bd e2 2b 57 3f 6f bd 7c cc 5a 11 7f 28 6c a2 9a 9f c0 90 e1 d4 16 d0 5f 42 81 ec 0c 2a 7f 7f 93>,
  size: 94234,
  path: '/tmp' }

```

#### API

```js
const importer = require('ipfs-unixfs-importer')
```

#### const import = importer(dag [, options])

The `import` object is a duplex pull stream that takes objects of the form:

```js
{
  path: 'a name',
  content: (Buffer, pull-stream emitting Buffers or a Readable stream)
}
```

`import` will output file info objects as files get stored in IPFS. When stats on a node are emitted they are guaranteed to have been written.

`dag` is an instance of the [`IPLD Resolver`](https://github.com/ipld/js-ipld-resolver) or the [`js-ipfs` `dag api`](https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/DAG.md)

The input's file paths and directory structure will be preserved in the [`dag-pb`](https://github.com/ipld/js-ipld-dag-pb) created nodes.

`options` is an JavaScript option that might include the following keys:

- `wrap` (boolean, defaults to false): if true, a wrapping node will be created
- `shardSplitThreshold` (positive integer, defaults to 1000): the number of directory entries above which we decide to use a sharding directory builder (instead of the default flat one)
- `chunker` (string, defaults to `"fixed"`): the chunking strategy. Supports:
  - `fixed`
  - `rabin`
- `chunkerOptions` (object, optional): the options for the chunker. Defaults to an object with the following properties:
  - `avgChunkSize` (positive integer, defaults to `262144`): the average chunk size (rabin chunker only)
  - `minChunkSize` (positive integer): the minimum chunk size (rabin chunker only)
  - `maxChunkSize` (positive integer, defaults to `262144`): the maximum chunk size
- `strategy` (string, defaults to `"balanced"`): the DAG builder strategy name. Supports:
  - `flat`: flat list of chunks
  - `balanced`: builds a balanced tree
  - `trickle`: builds [a trickle tree](https://github.com/ipfs/specs/pull/57#issuecomment-265205384)
- `maxChildrenPerNode` (positive integer, defaults to `174`): the maximum children per node for the `balanced` and `trickle` DAG builder strategies
- `layerRepeat` (positive integer, defaults to 4): (only applicable to the `trickle` DAG builder strategy). The maximum repetition of parent nodes for each layer of the tree.
- `reduceSingleLeafToSelf` (boolean, defaults to `true`): optimization for, when reducing a set of nodes with one node, reduce it to that node.
- `dirBuilder` (object): the options for the directory builder
  - `hamt` (object): the options for the HAMT sharded directory builder
    - bits (positive integer, defaults to `8`): the number of bits at each bucket of the HAMT
- `progress` (function): a function that will be called with the byte length of chunks as a file is added to ipfs.
- `onlyHash` (boolean, defaults to false): Only chunk and hash - do not write to disk
- `hashAlg` (string): multihash hashing algorithm to use
- `cidVersion` (integer, default 0): the CID version to use when storing the data (storage keys are based on the CID, _including_ it's version)
- `rawLeaves` (boolean, defaults to false): When a file would span multiple DAGNodes, if this is true the leaf nodes will not be wrapped in `UnixFS` protobufs and will instead contain the raw file bytes
- `leafType` (string, defaults to `'file'`) what type of UnixFS node leaves should be - can be `'file'` or `'raw'` (ignored when `rawLeaves` is `true`)

[dag API]: https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/DAG.md
[ipld-resolver instance]: https://github.com/ipld/js-ipld-resolver
[UnixFS]: https://github.com/ipfs/specs/tree/master/unixfs
[pull-stream]: https://www.npmjs.com/package/pull-stream

## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/ipfs/js-ipfs-unixfs-importer/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

[MIT](LICENSE)
