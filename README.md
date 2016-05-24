IPFS unixFS Engine
===================

> Import data into an IPFS DAG Service.

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![Build Status](https://travis-ci.org/ipfs/js-ipfs-unixfs-engine.svg?style=flat-square)](https://travis-ci.org/ipfs/js-ipfs-unixfs-engine)
[![Coverage Status](https://coveralls.io/repos/github/ipfs/js-ipfs-unixfs-engine/badge.svg?branch=master)](https://coveralls.io/github/ipfs/js-ipfs-unixfs-engine?branch=master)
[![Dependency Status](https://david-dm.org/ipfs/js-ipfs-unixfs-engine.svg?style=flat-square)](https://david-dm.org/ipfs/js-ipfs-unixfs-engine)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

## Example Importer

Let's create a little directory to import:
```sh
$ cd /tmp
$ mkdir foo
$ echo 'hello' > foo/bar
$ echo 'world' > foo/quux
```

And write the importing logic:
```js
// Dependencies to create a DAG Service (where the dir will be imported into)
const memStore = require('abstract-blob-store')
const ipfsRepo = require('ipfs-repo')
const ipfsBlock = require('ipfs-block')
const ipfsBlockService = require('ipfs-block-service')
const ipfsMerkleDag = require('ipfs-merkle-dag')
const fs = require('fs')

const repo = new ipfsRepo('', { stores: memStore })
const blocks = new ipfsBlockService(repo)
const dag = new ipfsMerkleDag.DAGService(blocks)


const Importer = require('ipfs-unixfs-engine').importer
const add = new Importer(dag)

// An array to hold the return of nested file/dir info from the importer
// A root DAG Node is received upon completion

const res = []

// Import path /tmp/foo/bar

const rs = fs.createReadStream(file)
const rs2 = fs.createReadStream(file2)
const input = {path: /tmp/foo/bar, content: rs}
const input2 = {path: /tmp/foo/quxx, content: rs2}

// Listen for the data event from the importer stream

add.on('data', (info) => {
	res.push(info)
})

// The end event of the stream signals that the importer is done

add.on('end', () => {
	console.log('Finished adding files!')
	return
})

// Calling write on the importer to add the file/object tuples

add.write(input)
add.write(input2)
add.end()
```

When run, the stat of DAG Node is outputted for each file on data event until the root:

```
{ multihash: <Buffer 12 20 bd e2 2b 57 3f 6f bd 7c cc 5a 11 7f 28 6c a2 9a 9f c0 90 e1 d4 16 d0 5f 42 81 ec 0c 2a 7f 7f 93>,
  Size: 39243,
  path: '/tmp/foo/bar' }

{ multihash: <Buffer 12 20 bd e2 2b 57 3f 6f bd 7c cc 5a 11 7f 28 6c a2 9a 9f c0 90 e1 d4 16 d0 5f 42 81 ec 0c 2a 7f 7f 93>,
  Size: 59843,
  path: '/tmp/foo/quxx' }

{ multihash: <Buffer 12 20 bd e2 2b 57 3f 6f bd 7c cc 5a 11 7f 28 6c a2 9a 9f c0 90 e1 d4 16 d0 5f 42 81 ec 0c 2a 7f 7f 93>,
  Size: 93242,
  path: '/tmp/foo' } 

{ multihash: <Buffer 12 20 bd e2 2b 57 3f 6f bd 7c cc 5a 11 7f 28 6c a2 9a 9f c0 90 e1 d4 16 d0 5f 42 81 ec 0c 2a 7f 7f 93>,
  Size: 94234,
  path: '/tmp' }   

```

## API

```js
const Importer = require('ipfs-unixfs-engine').importer
```

### const add = new Importer(dag)

The importer is a duplex stream in object mode that writes inputs of tuples 
of path and readable streams of data. You can stream an array of files to the 
importer, just call the 'end' function to signal that you are done inputting file/s.
Listen to the 'data' for the returned informtion 'multihash, size and path' for
each file added. Listen to the 'end' event from the stream to know when the 
importer has finished importing files. Input file paths with directory structure
will preserve the hierarchy in the dag node.

Uses the [DAG Service](https://github.com/vijayee/js-ipfs-merkle-dag/) instance
`dagService`. 

## Example Exporter

```
const ipfsRepo = require('ipfs-repo')
const ipfsBlock = require('ipfs-block')
const ipfsBlockService = require('ipfs-block-service')
const ipfsMerkleDag = require('ipfs-merkle-dag')

const repo = new ipfsRepo('', { stores: memStore })
const blocks = new ipfsBlockService(repo)
const dag = new ipfsMerkleDag.DAGService(blocks)

// Create an export readable object stream with the hash you want to export and a dag service

const exportEvent = Exporter(hash, dag)

// Pipe the return stream to console

exportEvent.on('data', (result) => {
	result.stream.pipe(process.stdout)
}
```

##API
```js
const Importer = require('ipfs-unixfs-engine').exporter
```

The exporter is a readable stream in object mode that returns an object ```{ content: stream, path: 'path' }``` by the multihash of the file from the dag service.


## install

With [npm](https://npmjs.org/) installed, run

```
$ npm install ipfs-unixfs-engine
```

## license

ISC
