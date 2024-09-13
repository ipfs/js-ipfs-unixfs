# ipfs-unixfs

[![ipfs.tech](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](https://ipfs.tech)
[![Discuss](https://img.shields.io/discourse/https/discuss.ipfs.tech/posts.svg?style=flat-square)](https://discuss.ipfs.tech)
[![codecov](https://img.shields.io/codecov/c/github/ipfs/js-ipfs-unixfs.svg?style=flat-square)](https://codecov.io/gh/ipfs/js-ipfs-unixfs)
[![CI](https://img.shields.io/github/actions/workflow/status/ipfs/js-ipfs-unixfs/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/ipfs/js-ipfs-unixfs/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> JavaScript implementation of IPFS' unixfs (a Unix FileSystem representation on top of a MerkleDAG)

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

This module contains the protobuf definition of the UnixFS data structure found at the root of all UnixFS DAGs.

The UnixFS spec can be found in the [ipfs/specs repository](http://github.com/ipfs/specs)

## Example - Create a file composed of several blocks

```JavaScript
const data = new UnixFS({ type: 'file' })
data.addBlockSize(256) // add the size of each block
data.addBlockSize(256)
// ...
```

## Example - Create a directory that contains several files

Creating a directory that contains several files is achieve by creating a unixfs element that identifies a MerkleDAG node as a directory. The links of that MerkleDAG node are the files that are contained in this directory.

```JavaScript
const data = new UnixFS({ type: 'directory' })
```

## Example - Create an unixfs Data element

```JavaScript
const data = new UnixFS([options])
```

`options` is an optional object argument that might include the following keys:

- type (string, default `file`): The type of UnixFS entry.  Can be:
  - `raw`
  - `directory`
  - `file`
  - `metadata`
  - `symlink`
  - `hamt-sharded-directory`
- data (Uint8Array): The optional data field for this node
- blockSizes (Array, default: `[]`): If this is a `file` node that is made up of multiple blocks, `blockSizes` is a list numbers that represent the size of the file chunks stored in each child node. It is used to calculate the total file size.
- mode (Number, default `0644` for files, `0755` for directories/hamt-sharded-directories) file mode
- mtime (`Date`, `{ secs, nsecs }`, `{ Seconds, FractionalNanoseconds }`, `[ secs, nsecs ]`): The modification time of this node

## Example - Add and remove a block size to the block size list

```JavaScript
data.addBlockSize(<size in bytes>)
```

```JavaScript
data.removeBlockSize(<index>)
```

## Example - Get total fileSize

```JavaScript
data.fileSize() // => size in bytes
```

## Example - Marshal and unmarshal

```javascript
const marshaled = data.marshal()
const unmarshaled = Unixfs.unmarshal(marshaled)
```

## Example - Is this UnixFS entry a directory?

```JavaScript
const dir = new Data({ type: 'directory' })
dir.isDirectory() // true

const file = new Data({ type: 'file' })
file.isDirectory() // false
```

## Example - Has an mtime been set?

If no modification time has been set, no `mtime` property will be present on the `Data` instance:

```JavaScript
const file = new Data({ type: 'file' })
file.mtime // undefined

Object.prototype.hasOwnProperty.call(file, 'mtime') // false

const dir = new Data({ type: 'dir', mtime: new Date() })
dir.mtime // { secs: Number, nsecs: Number }
```

# Install

```console
$ npm i ipfs-unixfs
```

## Browser `<script>` tag

Loading this module through a script tag will make its exports available as `IpfsUnixfs` in the global namespace.

```html
<script src="https://unpkg.com/ipfs-unixfs/dist/index.min.js"></script>
```

# API Docs

- <https://ipfs.github.io/js-ipfs-unixfs/modules/ipfs_unixfs.html>

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](https://github.com/ipfs/js-ipfs-unixfs/blob/main/packages/ipfs-unixfs/LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](https://github.com/ipfs/js-ipfs-unixfs/blob/main/packages/ipfs-unixfs/LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribute

Contributions welcome! Please check out [the issues](https://github.com/ipfs/js-ipfs-unixfs/issues).

Also see our [contributing document](https://github.com/ipfs/community/blob/master/CONTRIBUTING_JS.md) for more information on how we work, and about contributing in general.

Please be aware that all interactions related to this repo are subject to the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md)
