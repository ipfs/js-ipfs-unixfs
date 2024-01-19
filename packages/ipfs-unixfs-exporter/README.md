# ipfs-unixfs-exporter <!-- omit in toc -->

[![ipfs.tech](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](https://ipfs.tech)
[![Discuss](https://img.shields.io/discourse/https/discuss.ipfs.tech/posts.svg?style=flat-square)](https://discuss.ipfs.tech)
[![codecov](https://img.shields.io/codecov/c/github/ipfs/js-ipfs-unixfs.svg?style=flat-square)](https://codecov.io/gh/ipfs/js-ipfs-unixfs)
[![CI](https://img.shields.io/github/actions/workflow/status/ipfs/js-ipfs-unixfs/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/ipfs/js-ipfs-unixfs/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> JavaScript implementation of the UnixFs exporter used by IPFS

# About

The UnixFS Exporter provides a means to read DAGs from a blockstore given a CID.

## Example

```js
// import a file and export it again
import { importer } from 'ipfs-unixfs-importer'
import { exporter } from 'ipfs-unixfs-exporter'
import { MemoryBlockstore } from 'blockstore-core/memory'

// Should contain the blocks we are trying to export
const blockstore = new MemoryBlockstore()
const files = []

for await (const file of importer([{
  path: '/foo/bar.txt',
  content: new Uint8Array([0, 1, 2, 3])
}], blockstore)) {
  files.push(file)
}

console.info(files[0].cid) // Qmbaz

const entry = await exporter(files[0].cid, blockstore)

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

# Install

```console
$ npm i ipfs-unixfs-exporter
```

## Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `IpfsUnixfsExporter` in the global namespace.

```html
<script src="https://unpkg.com/ipfs-unixfs-exporter/dist/index.min.js"></script>
```

# API Docs

- <https://ipfs.github.io/js-ipfs-unixfs/modules/ipfs_unixfs_exporter.html>

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribute

Contributions welcome! Please check out [the issues](https://github.com/ipfs/js-ipfs-unixfs/issues).

Also see our [contributing document](https://github.com/ipfs/community/blob/master/CONTRIBUTING_JS.md) for more information on how we work, and about contributing in general.

Please be aware that all interactions related to this repo are subject to the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md)

[dag API]: https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/DAG.md

[blockstore]: https://github.com/ipfs/js-ipfs-interfaces/tree/master/packages/interface-blockstore#readme

[UnixFS]: https://github.com/ipfs/specs/tree/master/unixfs
