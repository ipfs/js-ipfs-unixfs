# ipfs-unixfs-exporter

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Jenkins](https://ci.ipfs.team/buildStatus/icon?job=ipfs/js-ipfs-unixfs-exporter/master)](https://ci.ipfs.team/job/ipfs/job/js-ipfs-unixfs-exporter/job/master/)
[![Codecov](https://codecov.io/gh/ipfs/js-ipfs-unixfs-exporter/branch/master/graph/badge.svg)](https://codecov.io/gh/ipfs/js-ipfs-unixfs-exporter)
[![Dependency Status](https://david-dm.org/ipfs/js-ipfs-unixfs-exporter.svg?style=flat-square)](https://david-dm.org/ipfs/js-ipfs-unixfs-exporter)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D3.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D8.0.0-orange.svg?style=flat-square)

> JavaScript implementation of the exporter used by IPFS to handle Files

## Lead Maintainer

[Alex Potsides](https://github.com/achingbrain)

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Example](#example)
  - [API](#api)
  - [exporter(cid, ipld)](#exportercid-ipld-options)
- [Contribute](#contribute)
- [License](#license)

## Install

```
> npm install ipfs-unixfs-exporter
```

## Usage

### Example

```js
// Create an export source pull-stream cid or ipfs path you want to export and a
// <dag or ipld-resolver instance> to fetch the file from
const exporter = require('ipfs-unixfs-exporter')
const pull = require('pull-stream/pull')
const { stdout } = require('pull-stdio')

const options = {}

pull(
  exporter(cid, ipld, options),
  collect((error, files) => {
    if (error) {
      // ...handle error
    }

    // Set up a pull stream that sends the file content to process.stdout
    pull(
      // files[0].content is a pull-stream that contains the bytes of the file
      files[0].content,
      stdout()
    )
  })
)
```

#### API

```js
const exporter = require('ipfs-unixfs-exporter')
```

### exporter(cid, ipld, options)

Uses the given [dag API][] or an [ipld-resolver instance][] to fetch an IPFS [UnixFS][] object(s) by their CID.

Creates a new pull stream that outputs objects of the form

```js
{
  path: 'a name',
  content: <pull stream>
}
```

#### `offset` and `length`

`offset` and `length` arguments can optionally be passed to the exporter function.  These will cause the returned stream to only emit bytes starting at `offset` and with length of `length`.

See [the tests](test/exporter.js) for examples of using these arguments.

```js
const exporter = require('ipfs-unixfs-exporter')
const pull = require('pull-stream')
const drain = require('pull-stream/sinks/drain')

pull(
  exporter(cid, ipld, {
    offset: 0,
    length: 10
  })
  drain((file) => {
    // file.content is a pull stream containing only the first 10 bytes of the file
  })
)
```

### `fullPath`

If specified the exporter will emit an entry for every path component encountered.

```javascript
const exporter = require('ipfs-unixfs-exporter')
const pull = require('pull-stream')
const collect = require('pull-stream/sinks/collect')

pull(
  exporter('QmFoo.../bar/baz.txt', ipld, {
    fullPath: true
  })
  collect((err, files) => {
    console.info(files)

    // [{
    //   depth: 0,
    //   name: 'QmFoo...',
    //   path: 'QmFoo...',
    //   size: ...
    //   hash: Buffer
    //   content: undefined
    //   type: 'dir'
    // }, {
    //   depth: 1,
    //   name: 'bar',
    //   path: 'QmFoo.../bar',
    //   size: ...
    //   hash: Buffer
    //   content: undefined
    //   type: 'dir'
    // }, {
    //   depth: 2,
    //   name: 'baz.txt',
    //   path: 'QmFoo.../bar/baz.txt',
    //   size: ...
    //   hash: Buffer
    //   content: <Pull stream>
    //   type: 'file'
    // }]
    //
  })
)
```

### `maxDepth`

If specified the exporter will only emit entries up to the specified depth.

```javascript
const exporter = require('ipfs-unixfs-exporter')
const pull = require('pull-stream')
const collect = require('pull-stream/sinks/collect')

pull(
  exporter('QmFoo.../bar/baz.txt', ipld, {
    fullPath: true,
    maxDepth: 1
  })
  collect((err, files) => {
    console.info(files)

    // [{
    //   depth: 0,
    //   name: 'QmFoo...',
    //   path: 'QmFoo...',
    //   size: ...
    //   hash: Buffer
    //   content: undefined
    //   type: 'dir'
    // }, {
    //   depth: 1,
    //   name: 'bar',
    //   path: 'QmFoo.../bar',
    //   size: ...
    //   hash: Buffer
    //   content: undefined
    //   type: 'dir'
    // }]
    //
  })
)
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
