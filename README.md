# ipfs-unixfs JavaScript Implementation

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Build Status](https://travis-ci.org/ipfs/js-ipfs-unixfs.svg?style=flat-square&branch=master)](https://travis-ci.org/ipfs/js-ipfs-unixfs)
[![Coverage Status](https://coveralls.io/repos/github/ipfs/js-ipfs-unixfs/badge.svg?branch=master)](https://coveralls.io/github/ipfs/js-ipfs-unixfs?branch=master)
[![Dependency Status](https://david-dm.org/ipfs/js-ipfs-unixfs.svg?style=flat-square)](https://david-dm.org/ipfs/js-ipfs-unixfs)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D3.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D4.0.0-orange.svg?style=flat-square)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/js-ipfs-unixfs.svg)](https://saucelabs.com/u/js-ipfs-unixfs)

> JavaScript implementation of IPFS' unixfs (a Unix FileSystem representation on top of a MerkleDAG)

[The unixfs spec can be found inside the ipfs/specs repository](http://github.com/ipfs/specs)

## Table of Contents

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
    - [unixfs Data Structure](#unixfs-data-structure)
    - [create an unixfs Data element](#create-an-unixfs-data-element)
    - [add and remove a block size to the block size list](#add-and-remove-a-block-size-to-the-block-size-list)
    - [get total fileSize](#get-total-filesize)
    - [marshal and unmarshal](#marshal-and-unmarshal)
- [Contribute](#contribute)
- [License](#license)

## Install

### npm

```sh
> npm i ipfs-unixfs
```

### Use in Node.js

```JavaScript
var Unixfs = require('ipfs-unixfs')
```

### Use in a browser with browserify, webpack or any other bundler

The code published to npm that gets loaded on require is in fact a ES5 transpiled version with the right shims added. This means that you can require it and use with your favourite bundler without having to adjust asset management process.

```JavaScript
var Unixfs = require('ipfs-unixfs')
```

### Use in a browser Using a script tag

Loading this module through a script tag will make the `Unixfs` obj available in the global namespace.

```html
<script src="https://npmcdn.com/ipfs-unixfs/dist/index.min.js"></script>
<!-- OR -->
<script src="https://npmcdn.com/ipfs-unixfs/dist/index.js"></script>
```

## Usage

### Examples

#### Create a file composed by several blocks

```JavaScript
var data = new Unixfs('file')
data.addBlockSize(256) // add the size of each block
data.addBlockSize(256)
// ...
```

#### Create a directory that contains several files

Creating a directory that contains several files is achieve by creating a unixfs element that identifies a MerkleDAG node as a directory. The links of that MerkleDAG node are the files that are contained in this directory.

```JavaScript
var data = new Unixfs('directory')
```

## API

#### unixfs Data Structure

```protobuf
message Data {
  enum DataType {
    Raw = 0;
    Directory = 1;
    File = 2;
    Metadata = 3;
    Symlink = 4;
  }

  required DataType Type = 1;
  optional bytes Data = 2;
  optional uint64 filesize = 3;
  repeated uint64 blocksizes = 4;
}

message Metadata {
  required string MimeType = 1;
}
```

#### create an unixfs Data element

```JavaScript
var data = new UnixFS(<type>, [<content>])
```

Type can be: `['raw', 'directory', 'file', 'metadata', 'symlink']`

#### add and remove a block size to the block size list

```JavaScript
data.addBlockSize(<size in bytes>)
```

```JavaScript
data.removeBlockSize(<index>)
```

#### get total fileSize

```JavaScript
data.fileSize() // => size in bytes
```

#### marshal and unmarshal

```
var marsheled = data.marshal()
var unmarsheled = Unixfs.unmarshal(marsheled)
```

## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/ipfs/js-ipfs-unixfs/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

[MIT](LICENSE)

