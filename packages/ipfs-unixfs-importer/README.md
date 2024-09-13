# ipfs-unixfs-importer

[![ipfs.tech](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](https://ipfs.tech)
[![Discuss](https://img.shields.io/discourse/https/discuss.ipfs.tech/posts.svg?style=flat-square)](https://discuss.ipfs.tech)
[![codecov](https://img.shields.io/codecov/c/github/ipfs/js-ipfs-unixfs.svg?style=flat-square)](https://codecov.io/gh/ipfs/js-ipfs-unixfs)
[![CI](https://img.shields.io/github/actions/workflow/status/ipfs/js-ipfs-unixfs/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/ipfs/js-ipfs-unixfs/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> JavaScript implementation of the UnixFs importer used by IPFS

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

## Example

Let's create a little directory to import:

```console
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

# Install

```console
$ npm i ipfs-unixfs-importer
```

## Browser `<script>` tag

Loading this module through a script tag will make its exports available as `IpfsUnixfsImporter` in the global namespace.

```html
<script src="https://unpkg.com/ipfs-unixfs-importer/dist/index.min.js"></script>
```

# API Docs

- <https://ipfs.github.io/js-ipfs-unixfs/modules/ipfs_unixfs_importer.html>

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](https://github.com/ipfs/js-ipfs-unixfs/blob/main/packages/ipfs-unixfs-importer/LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](https://github.com/ipfs/js-ipfs-unixfs/blob/main/packages/ipfs-unixfs-importer/LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribute

Contributions welcome! Please check out [the issues](https://github.com/ipfs/js-ipfs-unixfs/issues).

Also see our [contributing document](https://github.com/ipfs/community/blob/master/CONTRIBUTING_JS.md) for more information on how we work, and about contributing in general.

Please be aware that all interactions related to this repo are subject to the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md)
