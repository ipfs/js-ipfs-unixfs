# ipfs-unixfs-exporter

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Build Status](https://flat.badgen.net/travis/ipfs/js-ipfs-unixfs-exporter)](https://travis-ci.com/ipfs/js-ipfs-unixfs-exporter)
[![Codecov](https://codecov.io/gh/ipfs/js-ipfs-unixfs-exporter/branch/master/graph/badge.svg)](https://codecov.io/gh/ipfs/js-ipfs-unixfs-exporter)
[![Dependency Status](https://david-dm.org/ipfs/js-ipfs-unixfs-exporter.svg?style=flat-square)](https://david-dm.org/ipfs/js-ipfs-unixfs-exporter)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D3.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D8.0.0-orange.svg?style=flat-square)

> JavaScript implementation of the exporter used by IPFS to handle Files

## Lead Maintainer

[Alex Potsides](https://github.com/achingbrain)

## Table of Contents

- [ipfs-unixfs-exporter](#ipfs-unixfs-exporter)
  - [Lead Maintainer](#lead-maintainer)
  - [Table of Contents](#table-of-contents)
  - [Install](#install)
  - [Usage](#usage)
    - [Example](#example)
      - [API](#api)
    - [`exporter(cid, ipld)`](#exportercid-ipld)
      - [UnixFS V1 entries](#unixfs-v1-entries)
      - [Raw entries](#raw-entries)
      - [CBOR entries](#cbor-entries)
      - [`entry.content({ offset, length })`](#entrycontent-offset-length)
    - [`exporter.path(cid, ipld)`](#exporterpathcid-ipld)
    - [`exporter.recursive(cid, ipld)`](#exporterrecursivecid-ipld)
  - [Contribute](#contribute)
  - [License](#license)

## Install

```
> npm install ipfs-unixfs-exporter
```

## Usage

### Example

```js
// import a file and export it again
const importer = require('ipfs-unixfs-importer')
const exporter = require('ipfs-unixfs-exporter')

const files = []

for await (const file of importer([{
  path: '/foo/bar.txt',
  content: Buffer.from(0, 1, 2, 3)
}], ipld)) {
  files.push(file)
}

console.info(files[0].cid) // Qmbaz

const entry = await exporter(files[0].cid, ipld)

console.info(entry.cid) // Qmqux
console.info(entry.path) // Qmbaz/foo/bar.txt
console.info(entry.name) // bar.txt
console.info(entry.unixfs.fileSize()) // 4

// stream content from unixfs node
const bytes = []

for await (const buf of entry.content({
  offset: 0, // optional offset
  length: 4 // optional length
})) {
  bytes.push(buf)
}

const content = Buffer.concat(bytes)

console.info(content) // 0, 1, 2, 3
```

#### API

```js
const exporter = require('ipfs-unixfs-exporter')
```

### `exporter(cid, ipld)`

Uses the given [js-ipld instance][] to fetch an IPFS node by it's CID.

Returns a Promise which resolves to an `entry`.

#### UnixFS V1 entries

Entries with a `dag-pb` codec `CID` return UnixFS V1 entries:

```javascript
{
  name: 'foo.txt',
  path: 'Qmbar/foo.txt',
  cid: CID, // see https://github.com/multiformats/js-cid
  node: DAGNode, // see https://github.com/ipld/js-ipld-dag-pb
  content: function, // returns an async iterator
  unixfs: UnixFS // see https://github.com/ipfs/js-ipfs-unixfs
}
```

If the entry is a file, `entry.content()` returns an async iterator that yields one or more buffers containing the file content:

```javascript
if (entry.unixfs.type === 'file') {
  for await (const chunk of entry.content()) {
    // chunk is a Buffer
  }
}
```

If the entry is a directory or hamt shard, `entry.content()` returns further `entry` objects:

```javascript
if (entry.unixfs.type.includes('directory')) { // can be 'directory' or 'hamt-sharded-directory'
  for await (const entry of dir.content()) {
    console.info(entry.name)
  }
}
```

#### Raw entries

Entries with a `raw` codec `CID` return raw entries:

```javascript
{
  name: 'foo.txt',
  path: 'Qmbar/foo.txt',
  cid: CID, // see https://github.com/multiformats/js-cid
  node: Buffer, // see https://nodejs.org/api/buffer.html
  content: function, // returns an async iterator
}
```

`entry.content()` returns an async iterator that yields a buffer containing the node content:

```javascript
for await (const chunk of entry.content()) {
  // chunk is a Buffer
}
```

Unless you an options object containing `offset` and `length` keys as an argument to `entry.content()`, `chunk` will be equal to `entry.node`.

#### CBOR entries

Entries with a `dag-cbor` codec `CID` return JavaScript object entries:

```javascript
{
  name: 'foo.txt',
  path: 'Qmbar/foo.txt',
  cid: CID, // see https://github.com/multiformats/js-cid
  node: Object, // see https://github.com/ipld/js-ipld-dag-cbor
}
```

There is no `content` function for a `CBOR` node.


#### `entry.content({ offset, length })`

When `entry` is a file or a `raw` node, `offset` and/or `length` arguments can be passed to `entry.content()` to return slices of data:

```javascript
const bufs = []

for await (const chunk of entry.content({
  offset: 0,
  length: 5
})) {
  bufs.push(chunk)
}

// `data` contains the first 5 bytes of the file
const data = Buffer.concat(bufs)
```

If `entry` is a directory or hamt shard, passing `offset` and/or `length` to `entry.content()` will limit the number of files returned from the directory.

```javascript
const entries = []

for await (const entry of dir.content({
  offset: 0,
  length: 5
})) {
  entries.push(entry)
}

// `entries` contains the first 5 files/directories in the directory
```

### `exporter.path(cid, ipld)`

`exporter.path` will return an async iterator that yields entries for all segments in a path:

```javascript
const entries = []

for await (const entry of exporter.path('Qmfoo/foo/bar/baz.txt', ipld)) {
  entries.push(entry)
}

// entries contains 4x `entry` objects
```

### `exporter.recursive(cid, ipld)`

`exporter.recursive` will return an async iterator that yields all entries beneath a given CID or IPFS path, as well as the containing directory.

```javascript
const entries = []

for await (const child of exporter.recursive('Qmfoo/foo/bar', ipld)) {
  entries.push(entry)
}

// entries contains all children of the `Qmfoo/foo/bar` directory and it's children
```

[dag API]: https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/DAG.md
[ipld-resolver instance]: https://github.com/ipld/js-ipld-resolver
[UnixFS]: https://github.com/ipfs/specs/tree/master/unixfs
[pull-stream]: https://www.npmjs.com/package/pull-stream

## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/ipfs/js-ipfs-unixfs-exporter/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

[MIT](LICENSE)
