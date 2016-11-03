IPFS unixFS Engine
==================

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Build Status](https://travis-ci.org/ipfs/js-ipfs-unixfs-engine.svg?style=flat-square)](https://travis-ci.org/ipfs/js-ipfs-unixfs-engine)
[![Coverage Status](https://coveralls.io/repos/github/ipfs/js-ipfs-unixfs-engine/badge.svg?branch=master)](https://coveralls.io/github/ipfs/js-ipfs-unixfs-engine?branch=master)
[![Dependency Status](https://david-dm.org/ipfs/js-ipfs-unixfs-engine.svg?style=flat-square)](https://david-dm.org/ipfs/js-ipfs-unixfs-engine)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D3.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D4.0.0-orange.svg?style=flat-square)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/ipfs-unixfs-engine.svg)](https://saucelabs.com/u/ipfs-unixfs-engine)

> JavaScript implementation of the layout and chunking mechanisms used by IPFS

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Example Importer](#example-importer)
  - [Importer API](#importer-api)
    - [const add = new Importer(dag)](#const-add--new-importerdag)
  - [Example Exporter](#example-exporter)
  - [Exporter: API](#exporter-api)
  - [new Exporter(hash, dagService)](#new-exporterhash-dagservice)
- [Contribute](#contribute)
- [License](#license)

## BEWARE BEWARE BEWARE there might be 🐉

This module has passed through several iterations and still is far from a nice and easy understandable codebase. Currently missing features:

- tar importer
- trickle dag exporter
- sharding

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install ipfs-unixfs-engine
```

## Usage

### Example Importer

Let's create a little directory to import:
```sh
$ cd /tmp
$ mkdir foo
$ echo 'hello' > foo/bar
$ echo 'world' > foo/quux
```

And write the importing logic:
```js
// Dependencies to create a DAG Service (where the dir will be imported into)
const memStore = require('abstract-blob-store')
const Repo = require('ipfs-repo')
const Block = require('ipfs-block')
const BlockService = require('ipfs-block-service')
const MerkleDag = require('ipfs-merkle-dag')
const fs = require('fs')

const repo = new Repo('', { stores: memStore })
const blockService = new BlockService(repo)
const dagService = new ipfsMerkleDag.DAGService(blocks)


const Importer = require('ipfs-unixfs-engine').Importer
const filesAddStream = new Importer(dagService)

// An array to hold the return of nested file/dir info from the importer
// A root DAG Node is received upon completion

const res = []

// Import path /tmp/foo/bar

const rs = fs.createReadStream(file)
const rs2 = fs.createReadStream(file2)
const input = {path: /tmp/foo/bar, content: rs}
const input2 = {path: /tmp/foo/quxx, content: rs2}

// Listen for the data event from the importer stream

filesAddStream.on('data', (info) => {
	res.push(info)
})

// The end event of the stream signals that the importer is done

filesAddStream.on('end', () => {
	console.log('Finished filesAddStreaming files!')
})

// Calling write on the importer to filesAddStream the file/object tuples

filesAddStream.write(input)
filesAddStream.write(input2)
filesAddStream.end()
```

When run, the stat of DAG Node is outputted for each file on data event until the root:
```
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

### Importer API

```js
const Importer = require('ipfs-unixfs-engine').importer
```

#### const add = new Importer(dag)

The importer is a object Transform stream that accepts objects of the form

```js
{
  path: 'a name',
  content: (Buffer or Readable stream)
}
```

The stream will output IPFS DAG Node stats for the nodes as they are added to
the DAG Service. When stats on a node are emitted they are guaranteed to have
been written into the [DAG Service][]'s storage mechanism.

The input's file paths and directory structure will be preserved in the DAG
Nodes.


### Example Exporter

```
const Repo = require('ipfs-repo')
const Block = require('ipfs-block')
const BlockService = require('ipfs-block-service')
const MerkleDAG = require('ipfs-merkle-dag')

const repo = new Repo('', { stores: memStore })
const blockService = new BlockService(repo)
const dagService = new MerkleDag.DAGService(blockService)

// Create an export readable object stream with the hash you want to export and a dag service

const filesStream = Exporter(<multihash>, dag)

// Pipe the return stream to console

filesStream.on('data', (file) => {
	file.content.pipe(process.stdout)
}
```

### Exporter: API

```js
const Exporter = require('ipfs-unixfs-engine').Exporter
```

### new Exporter(hash, dagService)

Uses the given [DAG Service][] to fetch an IPFS [UnixFS][] object(s) by their multiaddress.

Creates a new readable stream in object mode that outputs objects of the form

```js
{
  path: 'a name',
  content: (Buffer or Readable stream)
}
```

Errors are received as with a normal stream, by listening on the `'error'` event to be emitted.


[DAG Service]: https://github.com/vijayee/js-ipfs-merkle-dag/
[UnixFS]: https://github.com/ipfs/specs/tree/master/unixfs

## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/ipfs/js-ipfs-unixfs-engine/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

[MIT](LICENSE)
