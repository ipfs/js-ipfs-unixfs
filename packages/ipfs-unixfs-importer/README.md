# ipfs-unixfs-importer <!-- omit in toc -->

[![ipfs.tech](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](https://ipfs.tech)
[![Discuss](https://img.shields.io/discourse/https/discuss.ipfs.tech/posts.svg?style=flat-square)](https://discuss.ipfs.tech)
[![codecov](https://img.shields.io/codecov/c/github/ipfs/js-ipfs-unixfs.svg?style=flat-square)](https://codecov.io/gh/ipfs/js-ipfs-unixfs)
[![CI](https://img.shields.io/github/actions/workflow/status/ipfs/js-ipfs-unixfs/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/ipfs/js-ipfs-unixfs/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> JavaScript implementation of the UnixFs importer used by IPFS

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
- [Example](#example)
- [API](#api)
  - [const stream = importer(source, blockstore \[, options\])](#const-stream--importersource-blockstore--options)
  - [const result = await importFile(content, blockstore \[, options\])](#const-result--await-importfilecontent-blockstore--options)
  - [const result = await importDirectory(content, blockstore \[, options\])](#const-result--await-importdirectorycontent-blockstore--options)
  - [const result = await importBytes(buf, blockstore \[, options\])](#const-result--await-importbytesbuf-blockstore--options)
  - [const result = await importByteStream(source, blockstore \[, options\])](#const-result--await-importbytestreamsource-blockstore--options)
- [API Docs](#api-docs)
- [License](#license)
- [Contribute](#contribute)

## Install

```console
$ npm i ipfs-unixfs-importer
```

### Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `IpfsUnixfsImporter` in the global namespace.

```html
<script src="https://unpkg.com/ipfs-unixfs-importer/dist/index.min.js"></script>
```

## Example

Let's create a little directory to import:

```sh
> cd /tmp
> mkdir foo
> echo 'hello' > foo/bar
> echo 'world' > foo/quux
```

And write the importing logic:

```js
import { importer } from 'ipfs-unixfs-importer'
import { MemoryBlockstore } from 'blockstore-core/memory'
import * as fs from 'node:fs'

// Where the blocks will be stored
const blockstore = new MemoryBlockstore()

// Import path /tmp/foo/
const source = [{
  path: '/tmp/foo/bar',
  content: fs.createReadStream('/tmp/foo/bar')
}, {
  path: '/tmp/foo/quxx',
  content: fs.createReadStream('/tmp/foo/quux')
}]

for await (const entry of importer(source, blockstore)) {
  console.info(entry)
}
```

When run, metadata about DAGNodes in the created tree is printed until the root:

```js
{
  cid: CID, // see https://github.com/multiformats/js-cid
  path: 'tmp/foo/bar',
  unixfs: UnixFS // see https://github.com/ipfs/js-ipfs-unixfs
}
{
  cid: CID, // see https://github.com/multiformats/js-cid
  path: 'tmp/foo/quxx',
  unixfs: UnixFS // see https://github.com/ipfs/js-ipfs-unixfs
}
{
  cid: CID, // see https://github.com/multiformats/js-cid
  path: 'tmp/foo',
  unixfs: UnixFS // see https://github.com/ipfs/js-ipfs-unixfs
}
{
  cid: CID, // see https://github.com/multiformats/js-cid
  path: 'tmp',
  unixfs: UnixFS // see https://github.com/ipfs/js-ipfs-unixfs
}
```

## API

```js
import { importer, importFile, importDir, importBytes, importByteStream } from 'ipfs-unixfs-importer'
```

### const stream = importer(source, blockstore \[, options])

The `importer` function returns an async iterator takes a source async iterator that yields objects of the form:

```js
{
  path: 'a name',
  content: (Buffer or iterator emitting Buffers),
  mtime: (Number representing seconds since (positive) or before (negative) the Unix Epoch),
  mode: (Number representing ugo-rwx, setuid, setguid and sticky bit)
}
```

`stream` will output file info objects as files get stored in IPFS. When stats on a node are emitted they are guaranteed to have been written.

`blockstore` is an instance of a [blockstore][]

The input's file paths and directory structure will be preserved in the [`dag-pb`](https://github.com/ipld/js-dag-pb) created nodes.

### const result = await importFile(content, blockstore \[, options])

A convenience function for importing a single file or directory.

### const result = await importDirectory(content, blockstore \[, options])

A convenience function for importing a directory - note this is non-recursive, to import recursively use the [importer](#const-stream--importersource-blockstore--options) function.

### const result = await importBytes(buf, blockstore \[, options])

A convenience function for importing a single Uint8Array.

### const result = await importByteStream(source, blockstore \[, options])

A convenience function for importing a single stream of Uint8Arrays.

## API Docs

- <https://ipfs.github.io/js-ipfs-unixfs/modules/ipfs_unixfs_importer.html>

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribute

Contributions welcome! Please check out [the issues](https://github.com/ipfs/js-ipfs-unixfs/issues).

Also see our [contributing document](https://github.com/ipfs/community/blob/master/CONTRIBUTING_JS.md) for more information on how we work, and about contributing in general.

Please be aware that all interactions related to this repo are subject to the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md)

[blockstore]: https://github.com/ipfs/js-ipfs-interfaces/tree/master/packages/interface-blockstore#readme

[UnixFS]: https://github.com/ipfs/specs/tree/master/unixfs

[IPLD]: https://github.com/ipld/js-ipld

[CID]: https://github.com/multiformats/js-cid
