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

- [Structure](#structure)
- [Development](#development)
  - [Publishing new versions](#publishing-new-versions)
  - [Using prerelease versions](#using-prerelease-versions)
- [Contribute](#contribute)
- [License](#license)

## Structure

This project is broken into several modules, their purposes are:

* `/packages/ipfs-unixfs` Serialization/deserialization of UnixFS objects to protocol buffers
* `/packages/ipfs-unixfs-importer` Builds DAGs from files and directories
* `/packages/ipfs-unixfs-exporter` Exports DAGs

## Development

1. Clone this repo
2. Run `npm install`

This will install lerna and bootstrap the various packages, dedpuing and hoisting dependencies into the root folder.

If later you wish to remove all the `node_modules`/`dist` folders and start again, run `npm reset && npm install` from the root.

See the scripts section of the root [`package.json`](./package.json) for more commands.

### Publishing new versions

1. Ensure you have a `GH_TOKEN` env var containing a GitHub [Personal Access Token](https://github.com/settings/tokens) with `public_repo` permissions
2. From the root of this repo run `npm run release` and follow the on screen prompts.  It will use [conventional commits](https://www.conventionalcommits.org) to work out the new package version

### Using prerelease versions

Any changed packages from each successful build of master are published to npm as canary builds under the npm tag `next`.

Canary builds only consider changes to packages in the last built commit so changes to the root config files should not result in new prereleases being published to npm.

## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/ipfs/js-ipfs-unixfs/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

[MIT](LICENSE)
