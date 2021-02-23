# ipfs-unixfs-exporter

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![Build Status](https://flat.badgen.net/travis/ipfs/js-ipfs-unixfs)](https://travis-ci.com/ipfs/js-ipfs-unixfs)
[![Codecov](https://codecov.io/gh/ipfs/js-ipfs-unixfs/branch/master/graph/badge.svg)](https://codecov.io/gh/ipfs/js-ipfs-unixfs)

> Exports UnixFS and other DAGs from IPFS

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
    - [`exporter(cid, ipld, options)`](#exportercid-ipld-options)
      - [UnixFSEntry](#unixfsentry)
      - [Raw entries](#raw-entries)
      - [CBOR entries](#cbor-entries)
      - [`entry.content({ offset, length })`](#entrycontent-offset-length-)
    - [`walkPath(cid, ipld)`](#walkpathcid-ipld)
    - [`recursive(cid, ipld)`](#recursivecid-ipld)
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
const { importer } = require('ipfs-unixfs-importer')
const { exporter } = require('ipfs-unixfs-exporter')

const files = []

for await (const file of importer([{
  path: '/foo/bar.txt',
  content: new Uint8Array([0, 1, 2, 3])
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
const size = entry.unixfs.fileSize()
const bytes = new Uint8Array(size)
let offset = 0

for await (const buf of entry.content()) {
  bytes.set(buf, offset)
  offset += chunk.length
}

console.info(bytes) // 0, 1, 2, 3
```

#### API

```js
const { exporter } = require('ipfs-unixfs-exporter')
```

### `exporter(cid, ipld, options)`

Uses the given [ipld](https://github.com/ipld/js-ipld) instance to fetch an IPFS node by it's CID.

Returns a Promise which resolves to a `UnixFSEntry`.

`options` is an optional object argument that might include the following keys:

- `signal` ([AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)): Used to cancel any network requests that are initiated as a result of this export

#### UnixFSEntry

```javascript
{
  type: 'file' // or 'directory'
  name: 'foo.txt',
  path: 'Qmbar/foo.txt',
  cid: CID, // see https://github.com/multiformats/js-cid
  content: function, // returns an async iterator
  unixfs: UnixFS // see https://github.com/ipfs/js-ipfs-unixfs
}
```

If the entry is a file, `entry.content()` returns an async iterator that yields one or more Uint8Arrays containing the file content:

```javascript
if (entry.type === 'file') {
  for await (const chunk of entry.content()) {
    // chunk is a Buffer
  }
}
```

If the entry is a directory, `entry.content()` returns further `entry` objects:

```javascript
if (entry.type === 'directory') {
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
  node: Uint8Array,
  content: function // returns an async iterator that yields a single object - see https://github.com/ipld/js-ipld-dag-cbor
}
```

There is no `content` function for a `CBOR` node.

#### `entry.content({ offset, length })`

When `entry` is a file or a `raw` node, `offset` and/or `length` arguments can be passed to `entry.content()` to return slices of data:

```javascript
const length = 5
const data = new Uint8Array(length)
let offset = 0

for await (const chunk of entry.content({
  offset: 0,
  length
})) {
  data.set(chunk, offset)
  offset += chunk.length
}

// `data` contains the first 5 bytes of the file
return data
```

If `entry` is a directory, passing `offset` and/or `length` to `entry.content()` will limit the number of files returned from the directory.

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

### `walkPath(cid, ipld)`

`walkPath` will return an async iterator that yields entries for all segments in a path:

```javascript
const { walkPath } = require('ipfs-unixfs-exporter')

const entries = []

for await (const entry of walkPath('Qmfoo/foo/bar/baz.txt', ipld)) {
  entries.push(entry)
}

// entries contains 4x `entry` objects
```

### `recursive(cid, ipld)`

`recursive` will return an async iterator that yields all entries beneath a given CID or IPFS path, as well as the containing directory.

```javascript
const { recursive } = require('ipfs-unixfs-exporter')

const entries = []

for await (const child of recursive('Qmfoo/foo/bar', ipld)) {
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
