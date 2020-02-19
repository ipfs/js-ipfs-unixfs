# ipfs-unixfs <!-- omit in toc -->

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![Travis CI](https://flat.badgen.net/travis/ipfs/js-ipfs-unixfs)](https://travis-ci.com/ipfs/js-ipfs-unixfs)
[![Codecov](https://codecov.io/gh/ipfs/js-ipfs-unixfs/branch/master/graph/badge.svg)](https://codecov.io/gh/ipfs/js-ipfs-unixfs)
[![Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

> JavaScript implementation of IPFS' UnixFS (a representation of a Unix file system on top of a MerkleDAG)

The UnixFS spec can be found at [ipfs/specs/UNIXFS.md](https://github.com/ipfs/specs/blob/master/UNIXFS.md)

## Lead Maintainer <!-- omit in toc -->

[Alex Potsides](https://github.com/achingbrain)

## Table of Contents <!-- omit in toc -->

- [Install](#install)
  - [npm](#npm)
  - [Use in Node.js](#use-in-nodejs)
  - [Use in a browser with browserify, webpack or any other bundler](#use-in-a-browser-with-browserify-webpack-or-any-other-bundler)
  - [Use in a browser Using a script tag](#use-in-a-browser-using-a-script-tag)
- [Usage](#usage)
  - [Examples](#examples)
    - [Create a file composed by several blocks](#create-a-file-composed-by-several-blocks)
    - [Create a directory that contains several files](#create-a-directory-that-contains-several-files)
- [API](#api)
    - [UnixFS Data Structure](#unixfs-data-structure)
    - [create an unixfs Data element](#create-an-unixfs-data-element)
    - [add and remove a block size to the block size list](#add-and-remove-a-block-size-to-the-block-size-list)
    - [get total fileSize](#get-total-filesize)
    - [marshal and unmarshal](#marshal-and-unmarshal)
    - [is this UnixFS entry a directory?](#is-this-unixfs-entry-a-directory)
    - [has an mtime been set?](#has-an-mtime-been-set)
- [Contribute](#contribute)
- [License](#license)

## Structure

* `/packages/ipfs-unixfs` Serialization/deserialization of UnixFS objects to protocol buffers
* `/packages/ipfs-unixfs-importer` Builds DAGs from files and directories
* `/packages/ipfs-unixfs-exporter` Exports DAGs

## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/ipfs/js-ipfs-unixfs/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

[MIT](LICENSE)
