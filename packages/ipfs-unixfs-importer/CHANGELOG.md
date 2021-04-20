# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [7.0.3](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@7.0.2...ipfs-unixfs-importer@7.0.3) (2021-04-20)

**Note:** Version bump only for package ipfs-unixfs-importer





## [7.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@7.0.1...ipfs-unixfs-importer@7.0.2) (2021-04-16)

**Note:** Version bump only for package ipfs-unixfs-importer





## [7.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@7.0.0...ipfs-unixfs-importer@7.0.1) (2021-03-19)

**Note:** Version bump only for package ipfs-unixfs-importer





# [7.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@6.0.1...ipfs-unixfs-importer@7.0.0) (2021-03-15)


### chore

* declare interface types in .d.ts file ([#122](https://github.com/ipfs/js-ipfs-unixfs/issues/122)) ([eaa8449](https://github.com/ipfs/js-ipfs-unixfs/commit/eaa8449c10abed9d9a378bee544b4ff501666c4b))


### BREAKING CHANGES

* switches to named exports





## [6.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@6.0.0...ipfs-unixfs-importer@6.0.1) (2021-02-23)


### Bug Fixes

* use ipfs-core-types instead of redefining ipld ([#121](https://github.com/ipfs/js-ipfs-unixfs/issues/121)) ([6cfd51d](https://github.com/ipfs/js-ipfs-unixfs/commit/6cfd51de4f00cf4ee3c6a78c378439b80d0e2c25))





# [6.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@5.0.0...ipfs-unixfs-importer@6.0.0) (2021-02-18)


### Features

* add types ([#114](https://github.com/ipfs/js-ipfs-unixfs/issues/114)) ([ca26353](https://github.com/ipfs/js-ipfs-unixfs/commit/ca26353081ae192718532d3dbd60779863fe6d53))


### BREAKING CHANGES

* types are now included with all unixfs modules





# [5.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@4.0.0...ipfs-unixfs-importer@5.0.0) (2020-11-20)


### Features

* support multiple roots ([#93](https://github.com/ipfs/js-ipfs-unixfs/issues/93)) ([f97f60a](https://github.com/ipfs/js-ipfs-unixfs/commit/f97f60ad68ffbe46d007bcdca282ccf1489e1f12))


### BREAKING CHANGES

* Importing files that would result in multiple roots no longer throws an error





# [4.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@3.1.0...ipfs-unixfs-importer@4.0.0) (2020-11-06)


### Bug Fixes

* just do what the user asked ([#90](https://github.com/ipfs/js-ipfs-unixfs/issues/90)) ([7392a95](https://github.com/ipfs/js-ipfs-unixfs/commit/7392a9589dee23a94512a2384bcbbd2d6ff67225))


### BREAKING CHANGES

* We previously did things like set rawLeaves to true based on the CID version, now we do not.





# [3.1.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@3.0.4...ipfs-unixfs-importer@3.1.0) (2020-11-04)


### Features

* pass file name along with progress ([#87](https://github.com/ipfs/js-ipfs-unixfs/issues/87)) ([42ec5f5](https://github.com/ipfs/js-ipfs-unixfs/commit/42ec5f59e6045571ea460b3d9b993f0bb856579f)), closes [/github.com/ipfs/js-ipfs/blob/master/packages/ipfs-http-server/src/api/resources/files-regular.js#L254-L255](https://github.com//github.com/ipfs/js-ipfs/blob/master/packages/ipfs-http-server/src/api/resources/files-regular.js/issues/L254-L255)





## [3.0.4](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@3.0.3...ipfs-unixfs-importer@3.0.4) (2020-09-04)

**Note:** Version bump only for package ipfs-unixfs-importer





## [3.0.3](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@3.0.2...ipfs-unixfs-importer@3.0.3) (2020-08-25)

**Note:** Version bump only for package ipfs-unixfs-importer





## [3.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@3.0.1...ipfs-unixfs-importer@3.0.2) (2020-08-05)


### Bug Fixes

* replace node buffers with uint8arrays ([#69](https://github.com/ipfs/js-ipfs-unixfs/issues/69)) ([8a5aed2](https://github.com/ipfs/js-ipfs-unixfs/commit/8a5aed2ca76de16778ff37822c058531d4fcdcb5)), closes [#66](https://github.com/ipfs/js-ipfs-unixfs/issues/66)





## [3.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@3.0.0...ipfs-unixfs-importer@3.0.1) (2020-07-28)

**Note:** Version bump only for package ipfs-unixfs-importer





# [3.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@2.0.1...ipfs-unixfs-importer@3.0.0) (2020-07-28)


### Bug Fixes

* ignore high mode bits passed to constructor ([#53](https://github.com/ipfs/js-ipfs-unixfs/issues/53)) ([8e8d83d](https://github.com/ipfs/js-ipfs-unixfs/commit/8e8d83d757276be7e1cb2581abd4b562cb8209e2))


### chore

* remove node buffers from runtime code ([#66](https://github.com/ipfs/js-ipfs-unixfs/issues/66)) ([db60a42](https://github.com/ipfs/js-ipfs-unixfs/commit/db60a4232e600e73227e6ab8964be083eada389a))
* upgrade to dag-pb that supports Uint8Array ([#65](https://github.com/ipfs/js-ipfs-unixfs/issues/65)) ([b8b2ee3](https://github.com/ipfs/js-ipfs-unixfs/commit/b8b2ee324f17c4bb8a7931761aee02d1635b6ca2))


### BREAKING CHANGES

* does not convert input to node Buffers any more, uses Uint8Arrays instead
* dag-pb Links property now returns DAGLink objects





## [2.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@2.0.0...ipfs-unixfs-importer@2.0.1) (2020-04-24)


### Bug Fixes

* remove node globals ([#52](https://github.com/ipfs/js-ipfs-unixfs/issues/52)) ([5414412](https://github.com/ipfs/js-ipfs-unixfs/commit/5414412b6b228d7922a10210825c9b85b0362af6))





# [2.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@1.0.4...ipfs-unixfs-importer@2.0.0) (2020-04-23)


### Code Refactoring

* use the block API from ipfs instead of ipld internals ([#51](https://github.com/ipfs/js-ipfs-unixfs/issues/51)) ([cfecf39](https://github.com/ipfs/js-ipfs-unixfs/commit/cfecf390ae2747d2b6c55f4ebd039791f7162fec))


### BREAKING CHANGES

* The importer takes a pin argument (previously undocumented) - it used
to default to true but since this switches to use the block API the
default has changed to false, as the typical usage pattern is to pin
the root block of a DAG recursively instead of every block that makes
up the DAG.





## [1.0.4](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@1.0.3...ipfs-unixfs-importer@1.0.4) (2020-04-15)

**Note:** Version bump only for package ipfs-unixfs-importer





## [1.0.3](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@1.0.2...ipfs-unixfs-importer@1.0.3) (2020-03-30)

**Note:** Version bump only for package ipfs-unixfs-importer





## [1.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@1.0.1...ipfs-unixfs-importer@1.0.2) (2020-03-09)


### Bug Fixes

* bump rabin-wasm ([#46](https://github.com/ipfs/js-ipfs-unixfs/issues/46)) ([07e160e](https://github.com/ipfs/js-ipfs-unixfs/commit/07e160eef53bc4868195cdbdfcea04f5f06131d0))





## [1.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-importer@1.0.0...ipfs-unixfs-importer@1.0.1) (2020-03-03)


### Bug Fixes

* only ignore raw-leaves when file is small and metadata is present ([#44](https://github.com/ipfs/js-ipfs-unixfs/issues/44)) ([19bb45f](https://github.com/ipfs/js-ipfs-unixfs/commit/19bb45fd816d1e789e5715dfbb1988562708e76a))





# 1.0.0 (2020-02-21)

**Note:** Version bump only for package ipfs-unixfs-importer





<a name="0.45.0"></a>
# [0.45.0](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.44.1...v0.45.0) (2020-02-04)


### Bug Fixes

* only output unixfs things ([#49](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/49)) ([8ecdcf2](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/8ecdcf2))


### BREAKING CHANGES

* If your data is below the chunk size, and you have `rawLeaves` and
`reduceSingleLeafToSelf` set to true, you'll get a CID that resolves
to a bona fide UnixFS file back with metadata and all that good
stuff instead of a `dag-raw` node.



<a name="0.44.1"></a>
## [0.44.1](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.44.0...v0.44.1) (2020-02-03)


### Performance Improvements

* small bl ([#52](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/52)) ([3d461ce](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/3d461ce))



<a name="0.44.0"></a>
# [0.44.0](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.43.1...v0.44.0) (2020-01-15)


### Features

* allow overriding of internal functions ([#48](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/48)) ([0bff5f2](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/0bff5f2))



<a name="0.43.1"></a>
## [0.43.1](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.43.0...v0.43.1) (2020-01-09)


### Bug Fixes

* specify default codec ([4b79619](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/4b79619))



<a name="0.43.0"></a>
# [0.43.0](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.42.0...v0.43.0) (2020-01-08)



# [0.42.0](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.41.0...v0.42.0) (2019-11-27)


### Performance Improvements

* avoid unnecessary buffer copy ([#40](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/40)) ([b5e5b5a](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/b5e5b5a15f8460c0effbedfd6aa39a1e594733df))
* concurrent file import ([#41](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/41)) ([68ac8cc](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/68ac8cc233dbe73fcb8244911e09ed59789cddc9)), closes [#38](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/38)



<a name="0.41.0"></a>
# [0.41.0](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.40.0...v0.41.0) (2019-11-22)


### Features

* support storing metadata in unixfs nodes ([#39](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/39)) ([a47c9ed](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/a47c9ed))



# [0.40.0](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.39.11...v0.40.0) (2019-08-05)


### Bug Fixes

* update to newest IPLD libraries ([#37](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/37)) ([f79355f](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/f79355f))



## [0.39.11](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.39.10...v0.39.11) (2019-06-06)


### Bug Fixes

* validate rabin args ([#32](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/32)) ([55c5dba](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/55c5dba))



<a name="0.39.10"></a>
## [0.39.10](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.39.9...v0.39.10) (2019-06-04)


### Bug Fixes

* remove unused dep ([efa2ca2](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/efa2ca2))


### Features

* use a rabin chunker in wasm ([#31](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/31)) ([d4021db](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/d4021db))



<a name="0.39.9"></a>
## [0.39.9](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.39.8...v0.39.9) (2019-05-24)


### Features

* adds js implementation of rabin chunker for windows and browser ([#30](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/30)) ([542b3e4](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/542b3e4))



<a name="0.39.8"></a>
## [0.39.8](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.39.7...v0.39.8) (2019-05-24)


### Bug Fixes

* make trickle dag importer compatible with go ([#29](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/29)) ([01c7323](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/01c7323))



<a name="0.39.7"></a>
## [0.39.7](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.39.6...v0.39.7) (2019-05-23)


### Bug Fixes

* remove leftpad ([#28](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/28)) ([0aeb0f6](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/0aeb0f6))



<a name="0.39.6"></a>
## [0.39.6](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.39.5...v0.39.6) (2019-05-20)


### Bug Fixes

* final trickle dag tests ([#27](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/27)) ([72b8bc7](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/72b8bc7))



<a name="0.39.5"></a>
## [0.39.5](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.39.4...v0.39.5) (2019-05-20)



<a name="0.39.4"></a>
## [0.39.4](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.39.3...v0.39.4) (2019-05-20)


### Bug Fixes

* add missing dependency async-iterator-all ([#26](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/26)) ([83d4075](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/83d4075))



<a name="0.39.3"></a>
## [0.39.3](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.39.2...v0.39.3) (2019-05-18)



<a name="0.39.2"></a>
## [0.39.2](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.39.1...v0.39.2) (2019-05-17)


### Bug Fixes

* move async-iterator-first out of dev deps ([7b76f4b](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/7b76f4b))



<a name="0.39.1"></a>
## [0.39.1](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.39.0...v0.39.1) (2019-05-17)



<a name="0.39.0"></a>
# [0.39.0](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.38.5...v0.39.0) (2019-05-17)


### Features

* switch to async await ([#24](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/24)) ([2a40ecb](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/2a40ecb))



<a name="0.38.5"></a>
## [0.38.5](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.38.4...v0.38.5) (2019-03-18)



<a name="0.38.4"></a>
## [0.38.4](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.38.3...v0.38.4) (2019-01-18)



<a name="0.38.3"></a>
## [0.38.3](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.38.2...v0.38.3) (2019-01-16)


### Bug Fixes

* increase test timeouts for sharding ([#18](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/18)) ([bc35f6f](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/bc35f6f))



<a name="0.38.2"></a>
## [0.38.2](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.38.1...v0.38.2) (2019-01-14)



<a name="0.38.1"></a>
## [0.38.1](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.38.0...v0.38.1) (2019-01-14)


### Bug Fixes

* turn non-function progress callback into a noop ([#16](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/16)) ([6d2c15d](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/6d2c15d))



<a name="0.38.0"></a>
# [0.38.0](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.37.3...v0.38.0) (2019-01-04)


### Bug Fixes

* pull-stream/throughs/through is not pull-through ([df0abfa](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/df0abfa))


### Performance Improvements

* do not create new buffers ([4ef5dbc](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/4ef5dbc))
* switch out pull-block for bl ([#12](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/12)) ([4e5b618](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/4e5b618))
* write files in parallel chunks, use a through instead of a map ([6a86d55](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/6a86d55))



<a name="0.37.3"></a>
## [0.37.3](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.37.2...v0.37.3) (2018-12-19)


### Bug Fixes

* increase sharding timeouts ([69210b6](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/69210b6))



<a name="0.37.2"></a>
## [0.37.2](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.37.1...v0.37.2) (2018-12-04)


### Bug Fixes

* fix regex to match files with square brackets ([986f945](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/986f945))



<a name="0.37.1"></a>
## [0.37.1](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.37.0...v0.37.1) (2018-12-03)


### Performance Improvements

* deep require pull stream modules ([092b5b4](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/092b5b4))



<a name="0.37.0"></a>
# [0.37.0](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.36.0...v0.37.0) (2018-11-26)


### Features

* export hash function from sharding ([7e24107](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/7e24107))



<a name="0.36.0"></a>
# [0.36.0](https://github.com/ipfs/js-ipfs-unixfs-importer/compare/v0.34.0...v0.36.0) (2018-11-23)


### Bug Fixes

* support slashes in filenames ([3171fab](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/3171fab))


### Features

* split hamt out into separate module, closes [#1](https://github.com/ipfs/js-ipfs-unixfs-importer/issues/1) ([bf216a9](https://github.com/ipfs/js-ipfs-unixfs-importer/commit/bf216a9))



<a name="0.34.0"></a>
# [0.34.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.33.0...v0.34.0) (2018-11-12)


### Bug Fixes

* updates ipld-dag-pb dep to version without .cid properties ([aa61cce](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/aa61cce))



<a name="0.33.0"></a>
# [0.33.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.32.8...v0.33.0) (2018-10-27)


### Bug Fixes

* fixes [#230](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/230) by returning a through stream that emits the error instead of throwing it ([fdd8429](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/fdd8429))



<a name="0.32.8"></a>
## [0.32.8](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.32.7...v0.32.8) (2018-10-25)



<a name="0.32.7"></a>
## [0.32.7](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.32.6...v0.32.7) (2018-10-12)


### Bug Fixes

* return correct chunks of streams, fixes [#229](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/229) ([362c685](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/362c685))
* skip rabin tests on windows ([ea9e3c3](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/ea9e3c3))



<a name="0.32.6"></a>
## [0.32.6](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.32.5...v0.32.6) (2018-10-12)


### Bug Fixes

* do not use cid property of DAGNodes just yet ([7a2a308](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/7a2a308))



<a name="0.32.5"></a>
## [0.32.5](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.32.4...v0.32.5) (2018-10-12)


### Bug Fixes

* do not overwrite cid property of DAGNodes ([c2e38ae](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/c2e38ae))
* make sure errors from unmarshalling are caught ([8b2335c](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/8b2335c))



<a name="0.32.4"></a>
## [0.32.4](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.32.3...v0.32.4) (2018-08-23)


### Bug Fixes

* build & export interop with go-ipfs for small file raw leaves ([11885fa](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/11885fa))



<a name="0.32.3"></a>
## [0.32.3](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.32.2...v0.32.3) (2018-08-21)


### Bug Fixes

* import with CID version 1 ([6ef929d](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/6ef929d))
* typo ([c5cb38b](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/c5cb38b))



<a name="0.32.2"></a>
## [0.32.2](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.32.1...v0.32.2) (2018-08-11)


### Bug Fixes

* make rabin an optional dependency ([bef3152](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/bef3152))
* skip first hash algorithm as it is no longer valid ([0b84b76](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/0b84b76)), closes [js-multihash#57](https://github.com/js-multihash/issues/57)



<a name="0.32.1"></a>
## [0.32.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.32.0...v0.32.1) (2018-08-08)


### Bug Fixes

* do not emit empty buffers for non-empty files ([ccc4ad2](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/ccc4ad2))



<a name="0.32.0"></a>
# [0.32.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.31.3...v0.32.0) (2018-08-08)


### Features

* **importer:** add rabin fingerprinting chunk algorithm ([83a5feb](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/83a5feb)), closes [ipfs/js-ipfs#1283](https://github.com/ipfs/js-ipfs/issues/1283)



<a name="0.31.3"></a>
## [0.31.3](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.31.2...v0.31.3) (2018-07-24)


### Bug Fixes

* return cids from builder ([0d3d3d8](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/0d3d3d8))



<a name="0.31.2"></a>
## [0.31.2](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.31.1...v0.31.2) (2018-07-20)



<a name="0.31.1"></a>
## [0.31.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.31.0...v0.31.1) (2018-07-19)



<a name="0.31.0"></a>
# [0.31.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.30.1...v0.31.0) (2018-07-19)



<a name="0.30.1"></a>
## [0.30.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.30.0...v0.30.1) (2018-07-19)


### Features

* support --raw-leaves ([7a29d83](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/7a29d83)), closes [ipfs/js-ipfs#1432](https://github.com/ipfs/js-ipfs/issues/1432)



<a name="0.30.0"></a>
# [0.30.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.29.0...v0.30.0) (2018-06-12)



<a name="0.29.0"></a>
# [0.29.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.28.1...v0.29.0) (2018-04-23)



<a name="0.28.1"></a>
## [0.28.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.28.0...v0.28.1) (2018-04-12)



<a name="0.28.0"></a>
# [0.28.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.27.0...v0.28.0) (2018-04-10)



<a name="0.27.0"></a>
# [0.27.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.26.0...v0.27.0) (2018-03-27)


### Features

* exporter - support slicing streams stored in deeply nested DAGs ([#208](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/208)) ([8568cd5](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/8568cd5))



<a name="0.26.0"></a>
# [0.26.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.25.0...v0.26.0) (2018-03-22)


### Features

* Adds begin/end byte slices to exporter ([#207](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/207)) ([8e11d77](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/8e11d77))



<a name="0.25.0"></a>
# [0.25.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.24.4...v0.25.0) (2018-03-20)


### Features

* Add reader to read files or part of files as streams ([833accf](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/833accf))



<a name="0.24.4"></a>
## [0.24.4](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.24.3...v0.24.4) (2018-02-27)


### Bug Fixes

* use "ipld" instead of "ipld-resolver" ([f4de206](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/f4de206))



<a name="0.24.3"></a>
## [0.24.3](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.24.2...v0.24.3) (2018-02-27)



<a name="0.24.2"></a>
## [0.24.2](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.24.1...v0.24.2) (2017-12-15)



<a name="0.24.1"></a>
## [0.24.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.24.0...v0.24.1) (2017-11-12)



<a name="0.24.0"></a>
# [0.24.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.23.1...v0.24.0) (2017-11-12)


### Features

* exporter maxDepth ([#197](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/197)) ([211e4e3](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/211e4e3))



<a name="0.23.1"></a>
## [0.23.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.23.0...v0.23.1) (2017-11-10)


### Features

* windows interop ([#195](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/195)) ([aa21ff3](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/aa21ff3))



<a name="0.23.0"></a>
# [0.23.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.22.5...v0.23.0) (2017-11-07)


### Features

* Include hash field for exported files ([#191](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/191)) ([8b13957](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/8b13957))



<a name="0.22.5"></a>
## [0.22.5](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.22.4...v0.22.5) (2017-09-08)


### Features

* Use passed cidVersion option when writing to storage ([#185](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/185)) ([0cd2d60](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/0cd2d60))



<a name="0.22.4"></a>
## [0.22.4](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.22.3...v0.22.4) (2017-09-08)


### Features

* allow specify hash algorithm for large files ([#184](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/184)) ([69915da](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/69915da))



<a name="0.22.3"></a>
## [0.22.3](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.22.2...v0.22.3) (2017-09-07)



<a name="0.22.2"></a>
## [0.22.2](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.22.1...v0.22.2) (2017-09-07)


### Features

* Add `onlyHash` option ([#183](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/183)) ([7450a65](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/7450a65))
* adds call to progress bar function ([#179](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/179)) ([ac6f722](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/ac6f722))



<a name="0.22.1"></a>
## [0.22.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.22.0...v0.22.1) (2017-09-04)



<a name="0.22.0"></a>
# [0.22.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.21.0...v0.22.0) (2017-07-23)



<a name="0.21.0"></a>
# [0.21.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.20.0...v0.21.0) (2017-07-04)



<a name="0.20.0"></a>
# [0.20.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.19.2...v0.20.0) (2017-06-16)


### Features

* subtree support ([#175](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/175)) ([16b788c](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/16b788c))



<a name="0.19.2"></a>
## [0.19.2](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.19.1...v0.19.2) (2017-05-25)


### Bug Fixes

* **package:** update cids to version 0.5.0 ([59d6d0a](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/59d6d0a))


### Features

* dag-api direct support ([adaeb37](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/adaeb37))



<a name="0.19.1"></a>
## [0.19.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.19.0...v0.19.1) (2017-03-29)


### Bug Fixes

* adding a dir: leaf node gets replaced with dir if necessary ([1d682ec](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/1d682ec))



<a name="0.19.0"></a>
# [0.19.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.18.0...v0.19.0) (2017-03-24)


### Bug Fixes

* breaking the stack when importing ([993f746](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/993f746))
* passing browser tests ([29b2740](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/29b2740))
* using correct murmur3 codec name ([295d86e](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/295d86e))
* using the new IPLD API ([a80f4d8](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/a80f4d8))



<a name="0.18.0"></a>
# [0.18.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.17.0...v0.18.0) (2017-03-22)


### Bug Fixes

* **package:** update ipld-dag-pb to version 0.10.0 ([#154](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/154)) ([304ff25](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/304ff25))
* **package:** update pull-pause to version 0.0.1 ([#153](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/153)) ([4dd2143](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/4dd2143))


### Features

* upgrade to the next version of ipfs-block and blockservice ([0ca25b2](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/0ca25b2))



<a name="0.17.0"></a>
# [0.17.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.16.1...v0.17.0) (2017-02-08)


### Features

* update to latest ipld-resolver ([#137](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/137)) ([211dfb6](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/211dfb6))



<a name="0.16.1"></a>
## [0.16.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.16.0...v0.16.1) (2017-02-02)


### Bug Fixes

* exporter: recurse correctly into subdirs ([#136](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/136)) ([69c0d04](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/69c0d04))



<a name="0.16.0"></a>
# [0.16.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.15.4...v0.16.0) (2017-02-02)


### Bug Fixes

* **package:** update is-ipfs to version 0.3.0 ([#134](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/134)) ([0063f9d](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/0063f9d))



<a name="0.15.4"></a>
## [0.15.4](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.15.3...v0.15.4) (2017-01-31)


### Bug Fixes

* case for empty file ([#132](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/132)) ([fee55d1](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/fee55d1))



<a name="0.15.3"></a>
## [0.15.3](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.15.2...v0.15.3) (2017-01-30)


### Bug Fixes

* expect empty stream to not generate any nodes ([#131](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/131)) ([7b054b6](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/7b054b6))



<a name="0.15.2"></a>
## [0.15.2](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.15.1...v0.15.2) (2017-01-30)


### Bug Fixes

* stop export visitor from trying to resolve leaf object ([#130](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/130)) ([651f113](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/651f113))



<a name="0.15.1"></a>
## [0.15.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.15.0...v0.15.1) (2017-01-29)


### Bug Fixes

* **package:** update cids to version 0.4.0 ([#122](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/122)) ([65a6759](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/65a6759))



<a name="0.15.0"></a>
# [0.15.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.14.2...v0.15.0) (2017-01-11)



<a name="0.14.2"></a>
## [0.14.2](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.14.1...v0.14.2) (2016-12-13)



<a name="0.14.1"></a>
## [0.14.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.14.0...v0.14.1) (2016-12-08)



<a name="0.14.0"></a>
# [0.14.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.13.0...v0.14.0) (2016-11-24)


### Features

* upgrade to latest dag-pb API ([#88](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/88)) ([51d1245](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/51d1245))



<a name="0.13.0"></a>
# [0.13.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.12.0...v0.13.0) (2016-11-03)



<a name="0.12.0"></a>
# [0.12.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.11.4...v0.12.0) (2016-10-28)


### Bug Fixes

* **exporter:** add some parallel fetching of blocks where possible ([43503d4](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/43503d4))


### Features

* migrate importer to use IPLD Resolver and the new IPLD format ([89c3602](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/89c3602))



<a name="0.11.4"></a>
## [0.11.4](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.11.3...v0.11.4) (2016-09-11)


### Features

* **exporter:** implement recursive file export ([68e09a7](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/68e09a7))



<a name="0.11.3"></a>
## [0.11.3](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.11.2...v0.11.3) (2016-09-09)


### Features

* **exporter:** return file sizes ([73cf78a](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/73cf78a))



<a name="0.11.2"></a>
## [0.11.2](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.11.1...v0.11.2) (2016-09-09)



<a name="0.11.1"></a>
## [0.11.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.11.0...v0.11.1) (2016-09-09)



<a name="0.11.0"></a>
# [0.11.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.10.2...v0.11.0) (2016-09-08)


### Bug Fixes

* **tests:** ignore ordering ([f8d1b2a](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/f8d1b2a))



<a name="0.10.2"></a>
## [0.10.2](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.10.1...v0.10.2) (2016-08-09)



<a name="0.10.1"></a>
## [0.10.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.10.0...v0.10.1) (2016-08-09)



<a name="0.10.0"></a>
# [0.10.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.9.0...v0.10.0) (2016-06-28)



<a name="0.9.0"></a>
# [0.9.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.8.0...v0.9.0) (2016-05-27)



<a name="0.8.0"></a>
# [0.8.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.7.0...v0.8.0) (2016-05-21)



<a name="0.7.0"></a>
# [0.7.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.6.1...v0.7.0) (2016-05-21)



<a name="0.6.1"></a>
## [0.6.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.6.0...v0.6.1) (2016-05-05)



<a name="0.6.0"></a>
# [0.6.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.5.0...v0.6.0) (2016-05-03)



<a name="0.5.0"></a>
# [0.5.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.4.5...v0.5.0) (2016-04-26)



<a name="0.4.5"></a>
## [0.4.5](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.4.4...v0.4.5) (2016-04-24)



<a name="0.4.4"></a>
## [0.4.4](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.4.3...v0.4.4) (2016-04-24)



<a name="0.4.3"></a>
## [0.4.3](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.4.2...v0.4.3) (2016-04-24)


### Bug Fixes

* clean up dependencies ([a3bee40](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/a3bee40))
* **importer:** cleanup smaller issues ([eab17fe](https://github.com/ipfs/js-ipfs-unixfs-engine/commit/eab17fe))



<a name="0.4.2"></a>
## [0.4.2](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.4.1...v0.4.2) (2016-04-19)



<a name="0.4.1"></a>
## [0.4.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.4.0...v0.4.1) (2016-04-19)



<a name="0.4.0"></a>
# [0.4.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.3.3...v0.4.0) (2016-04-19)



<a name="0.3.3"></a>
## [0.3.3](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.3.2...v0.3.3) (2016-03-22)



<a name="0.3.2"></a>
## [0.3.2](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.3.1...v0.3.2) (2016-03-22)



<a name="0.3.1"></a>
## [0.3.1](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.3.0...v0.3.1) (2016-03-22)



<a name="0.3.0"></a>
# [0.3.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.2.0...v0.3.0) (2016-03-21)



<a name="0.2.0"></a>
# [0.2.0](https://github.com/ipfs/js-ipfs-unixfs-engine/compare/v0.1.0...v0.2.0) (2016-02-17)



<a name="0.1.0"></a>
# 0.1.0 (2016-02-12)
