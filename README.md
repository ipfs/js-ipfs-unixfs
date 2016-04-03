ipfs-unixfs JavaScript Implementation
=====================================

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![Build Status](https://travis-ci.org/ipfs/js-ipfs-unixfs.svg?style=flat-square&branch=master)](https://travis-ci.org/ipfs/js-ipfs-unixfs)
![](https://img.shields.io/badge/coverage-%3F%25-yellow.svg?style=flat-square)
[![Dependency Status](https://david-dm.org/ipfs/js-ipfs-unixfs.svg?style=flat-square)](https://david-dm.org/ipfs/js-ipfs-unixfs)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

> JavaScript implementation of IPFS' unixfs (a Unix FileSystem representation on top of a MerkleDAG)

[The unixfs spec can be found inside the ipfs/specs repository](http://github.com/ipfs/specs)

# Installation

## npm

```sh
> npm i ipfs-unixfs
```

## Use in Node.js

```JavaScript
var Unixfs = require('ipfs-unixfs')
```

## Use in a browser with browserify, webpack or any other bundler

The code published to npm that gets loaded on require is in fact a ES5 transpiled version with the right shims added. This means that you can require it and use with your favourite bundler without having to adjust asset management process.

```JavaScript
var Unixfs = require('ipfs-unixfs')
```

## Use in a browser Using a script tag

Loading this module through a script tag will make the `Unixfs` obj available in the global namespace.

```html
<script src="https://npmcdn.com/ipfs-unixfs/dist/index.min.js"></script>
<!-- OR -->
<script src="https://npmcdn.com/ipfs-unixfs/dist/index.js"></script>
```

# Usage

## Examples

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
