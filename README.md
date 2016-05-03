IPFS unixFS Engine
===================

> Import data into an IPFS DAG Service.

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![Build Status](https://travis-ci.org/ipfs/js-ipfs-unixfs-engine.svg?style=flat-square)](https://travis-ci.org/ipfs/js-ipfs-unixfs-engine)
[![Coverage Status](https://coveralls.io/repos/github/ipfs/js-ipfs-unixfs-engine/badge.svg?branch=master)](https://coveralls.io/github/ipfs/js-ipfs-unixfs-engine?branch=master)
[![Dependency Status](https://david-dm.org/ipfs/js-ipfs-unixfs-engine.svg?style=flat-square)](https://david-dm.org/ipfs/js-ipfs-unixfs-engine)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

## Example

Let's create a little directory to import:
```sh
$ cd /tmp
$ mkdir foo
$ echo 'hello' > foo/bar
$ echo 'warld' > foo/quux
```

And write the importing logic:
```js
// Dependencies to create a DAG Service (where the dir will be imported into)
var memStore = require('abstract-blob-store')
var ipfsRepo = require('ipfs-repo')
var ipfsBlock = require('ipfs-block')
var ipfsBlockService = require('ipfs-block')
var ipfsMerkleDag = require('ipfs-merkle-dag')

var repo = new ipfsRepo('', { stores: memStore })
var blocks = new ipfsBlockService(repo)
var dag = new ipfsMerkleDag.DAGService(blocks)


var ipfsData = require('ipfs-unixfs-engine')

// Import /tmp/foo
ipfsData.import('/tmp/foo', dag, {
  recursive: true
}, done)

// A root DAG Node is received upon completion
function done (err, rootStat) {
  if (err) { throw err }
  console.log(rootStat)
}
```

When run, the stat of root DAG Node is outputted:

```
{ Hash: <Buffer 12 20 bd e2 2b 57 3f 6f bd 7c cc 5a 11 7f 28 6c a2 9a 9f c0 90 e1 d4 16 d0 5f 42 81 ec 0c 2a 7f 7f 93>,
  Size: 59843,
  Name: 'foo' }
```

## API

```js
var importer = require('ipfs-data-importing')
```

### importer.import(target, dagService, opts, cb)

`target` can be a `string`, `Buffer`, or `Stream`. When it's a string, the file
or directory structure rooted on the filesystem at `target` is imported, with
the hierarchy preserved. If a Buffer or Stream, a single DAG node will be
imported representing the buffer or stream's contents.

Uses the [DAG Service](https://github.com/vijayee/js-ipfs-merkle-dag/) instance
`dagService`. Accepts the following `opts`:

- `recursive`: whether to recurse into directories. Defaults to `false`.

Calls the callback `cb(err, stat)` on completion or error, where `stat` is an
object with the `Hash`, `Size`, and `Name` of the root
[`DAGNode`](https://github.com/vijayee/js-ipfs-merkle-dag/).

## install

With [npm](https://npmjs.org/) installed, run

```
$ npm install ipfs-data-importing
```

## license

ISC
