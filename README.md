# js-ipfs-unixfs <!-- omit in toc -->

[![ipfs.tech](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](https://ipfs.tech)
[![Discuss](https://img.shields.io/discourse/https/discuss.ipfs.tech/posts.svg?style=flat-square)](https://discuss.ipfs.tech)
[![codecov](https://img.shields.io/codecov/c/github/ipfs/js-ipfs-unixfs.svg?style=flat-square)](https://codecov.io/gh/ipfs/js-ipfs-unixfs)
[![CI](https://img.shields.io/github/actions/workflow/status/ipfs/js-ipfs-unixfs/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/ipfs/js-ipfs-unixfs/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> JS implementation of the IPFS UnixFS

## Table of contents <!-- omit in toc -->

- [Structure](#structure)
- [Lead Maintainer <!-- omit in toc -->](#lead-maintainer----omit-in-toc---)
- [Development](#development)
  - [Publishing new versions](#publishing-new-versions)
  - [Using prerelease versions](#using-prerelease-versions)
- [API Docs](#api-docs)
- [License](#license)
- [Contribute](#contribute)

## Structure

- [`/packages/ipfs-unixfs`](./packages/ipfs-unixfs) JavaScript implementation of IPFS' unixfs (a Unix FileSystem representation on top of a MerkleDAG)
- [`/packages/ipfs-unixfs-exporter`](./packages/ipfs-unixfs-exporter) JavaScript implementation of the UnixFs exporter used by IPFS
- [`/packages/ipfs-unixfs-importer`](./packages/ipfs-unixfs-importer) JavaScript implementation of the UnixFs importer used by IPFS

The UnixFS spec can be found at [ipfs/specs/UNIXFS.md](https://github.com/ipfs/specs/blob/master/UNIXFS.md)

## Lead Maintainer <!-- omit in toc -->

[Alex Potsides](https://github.com/achingbrain)

- [`/packages/ipfs-unixfs`](./packages/ipfs-unixfs) Serialization/deserialization of UnixFS objects to protocol buffers
- [`/packages/ipfs-unixfs-importer`](./packages/ipfs-unixfs-importer) Builds DAGs from files and directories
- [`/packages/ipfs-unixfs-exporter`](./packages/ipfs-unixfs-exporter) Exports DAGs

## Development

1. Clone this repo
2. Run `npm install`

This will install [lerna](https://www.npmjs.com/package/lerna) and bootstrap the various packages, dedpuing and hoisting dependencies into the root folder.

If later you wish to remove all the `node_modules`/`dist` folders and start again, run `npm run reset && npm install` from the root.

See the scripts section of the root [`package.json`](./package.json) for more commands.

### Publishing new versions

1. Ensure you have a `GH_TOKEN` env var containing a GitHub [Personal Access Token](https://github.com/settings/tokens) with `public_repo` permissions
2. From the root of this repo run `npm run release` and follow the on screen prompts.  It will use [conventional commits](https://www.conventionalcommits.org) to work out the new package version

### Using prerelease versions

Any changed packages from each successful build of master are published to npm as canary builds under the npm tag `next`.

Canary builds only consider changes to packages in the last built commit so changes to the root config files should not result in new prereleases being published to npm.

## API Docs

- <https://ipfs.github.io/js-ipfs-unixfs>

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
