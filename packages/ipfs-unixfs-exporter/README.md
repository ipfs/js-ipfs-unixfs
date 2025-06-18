# ipfs-unixfs-exporter

[![ipfs.tech](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](https://ipfs.tech)
[![Discuss](https://img.shields.io/discourse/https/discuss.ipfs.tech/posts.svg?style=flat-square)](https://discuss.ipfs.tech)
[![codecov](https://img.shields.io/codecov/c/github/ipfs/js-ipfs-unixfs.svg?style=flat-square)](https://codecov.io/gh/ipfs/js-ipfs-unixfs)
[![CI](https://img.shields.io/github/actions/workflow/status/ipfs/js-ipfs-unixfs/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/ipfs/js-ipfs-unixfs/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> JavaScript implementation of the UnixFs exporter used by IPFS

# About

<!--

!IMPORTANT!

Everything in this README between "# About" and "# Install" is automatically
generated and will be overwritten the next time the doc generator is run.

To make changes to this section, please update the @packageDocumentation section
of src/index.js or src/index.ts

To experiment with formatting, please run "npm run docs" from the root of this
repo and examine the changes made.

-->

The UnixFS Exporter provides a means to read DAGs from a blockstore given a CID.

## Example

```TypeScript
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

if (entry.type !== 'file') {
  throw new Error('Unexpected entry type')
}

console.info(entry.cid) // Qmqux
console.info(entry.path) // Qmbaz/foo/bar.txt
console.info(entry.name) // bar.txt
console.info(entry.unixfs.fileSize()) // 4

// stream content from unixfs node
const size = entry.unixfs.fileSize()
const bytes = new Uint8Array(Number(size))
let offset = 0

for await (const buf of entry.content()) {
  bytes.set(buf, offset)
  offset += buf.byteLength
}

console.info(bytes) // 0, 1, 2, 3
```

# Install

```console
$ npm i ipfs-unixfs-exporter
```

## Browser `<script>` tag

Loading this module through a script tag will make its exports available as `IpfsUnixfsExporter` in the global namespace.

```html
<script src="https://unpkg.com/ipfs-unixfs-exporter/dist/index.min.js"></script>
```

# API Docs

- <https://ipfs.github.io/js-ipfs-unixfs/modules/ipfs_unixfs_exporter.html>

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](https://github.com/ipfs/js-ipfs-unixfs/blob/main/packages/ipfs-unixfs-exporter/LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](https://github.com/ipfs/js-ipfs-unixfs/blob/main/packages/ipfs-unixfs-exporter/LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribute

Contributions welcome! Please check out [the issues](https://github.com/ipfs/js-ipfs-unixfs/issues).

Also see our [contributing document](https://github.com/ipfs/community/blob/master/CONTRIBUTING_JS.md) for more information on how we work, and about contributing in general.

Please be aware that all interactions related to this repo are subject to the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md)
