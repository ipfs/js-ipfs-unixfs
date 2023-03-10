## [ipfs-unixfs-exporter-v12.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v12.0.0...ipfs-unixfs-exporter-v12.0.1) (2023-03-10)


### Bug Fixes

* parallelise loading of dag-pb links in directories when exporting ([#286](https://github.com/ipfs/js-ipfs-unixfs/issues/286)) ([9e01878](https://github.com/ipfs/js-ipfs-unixfs/commit/9e01878a6ec8fc32bb830f0ff67ec613c260e24f))

## [ipfs-unixfs-exporter-v12.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v11.0.0...ipfs-unixfs-exporter-v12.0.0) (2023-02-16)


### ⚠ BREAKING CHANGES

* The options object now accepts preconfigured instances of chunkers and file layouts - these can be imported from this module - see https://github.com/ipfs/js-ipfs-unixfs/pull/283 for more

### Features

* accept pre-configured import components as options instead of options for components ([#283](https://github.com/ipfs/js-ipfs-unixfs/issues/283)) ([5a38d01](https://github.com/ipfs/js-ipfs-unixfs/commit/5a38d0126457926d1c17aeee75700565b400e4cf))


### Dependencies

* update sibling dependencies ([c59954c](https://github.com/ipfs/js-ipfs-unixfs/commit/c59954c64933ee330cd40746d0fa720de83b6ea3))
* update sibling dependencies ([b4f6fc8](https://github.com/ipfs/js-ipfs-unixfs/commit/b4f6fc83245bc99223704ce918fd4db691221412))

## [ipfs-unixfs-exporter-v11.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v10.0.1...ipfs-unixfs-exporter-v11.0.0) (2023-02-09)


### ⚠ BREAKING CHANGES

* the `shardSplitThreshold` option has changed to `shardSplitThresholdBytes` and reflects a DAGNode size where sharding might kick in

### Features

* auto-shard based on node size ([#171](https://github.com/ipfs/js-ipfs-unixfs/issues/171)) ([6ef187f](https://github.com/ipfs/js-ipfs-unixfs/commit/6ef187f44f4cfac8efed50dde52fe555a3eea397)), closes [#149](https://github.com/ipfs/js-ipfs-unixfs/issues/149)


### Dependencies

* update sibling dependencies ([54018a1](https://github.com/ipfs/js-ipfs-unixfs/commit/54018a1da722e65551dc8e9a706712c9f856d038))
* update sibling dependencies ([1a37705](https://github.com/ipfs/js-ipfs-unixfs/commit/1a377055647cfd0263f9b31a2613f72944333bc0))

## [ipfs-unixfs-exporter-v10.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v10.0.0...ipfs-unixfs-exporter-v10.0.1) (2023-02-09)


### Dependencies

* bump aegir from 37.12.1 to 38.1.2 ([#281](https://github.com/ipfs/js-ipfs-unixfs/issues/281)) ([ee4784e](https://github.com/ipfs/js-ipfs-unixfs/commit/ee4784ea5a6fc805019ad6f9b742aac7d33c0bb3))

## [ipfs-unixfs-exporter-v10.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v9.0.2...ipfs-unixfs-exporter-v10.0.0) (2023-01-06)


### ⚠ BREAKING CHANGES

* update dependencies (#278)

### Bug Fixes

* update dependencies ([#278](https://github.com/ipfs/js-ipfs-unixfs/issues/278)) ([0e1e3d3](https://github.com/ipfs/js-ipfs-unixfs/commit/0e1e3d37b2fe6c6fe96d0c851a53d6eb413d8fbd))


### Dependencies

* update sibling dependencies ([1d0baea](https://github.com/ipfs/js-ipfs-unixfs/commit/1d0baeafa3e7008dc1c89431aac6ee92e51fb544))
* update sibling dependencies ([d853c0e](https://github.com/ipfs/js-ipfs-unixfs/commit/d853c0ee16afc38b887130c1a8e891664982e048))

## [ipfs-unixfs-exporter-v9.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v9.0.1...ipfs-unixfs-exporter-v9.0.2) (2022-12-15)


### Trivial Changes

* update project config ([#274](https://github.com/ipfs/js-ipfs-unixfs/issues/274)) ([4d9a4fd](https://github.com/ipfs/js-ipfs-unixfs/commit/4d9a4fd690e54cc72d2b985357932aaf22413ec7))


### Dependencies

* **dev:** bump sinon from 14.0.2 to 15.0.0 ([#272](https://github.com/ipfs/js-ipfs-unixfs/issues/272)) ([73559d2](https://github.com/ipfs/js-ipfs-unixfs/commit/73559d23d483d004a60a96803a8404f1e8956a05))

## [ipfs-unixfs-exporter-v9.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v9.0.0...ipfs-unixfs-exporter-v9.0.1) (2022-10-19)


### Dependencies

* update sibling deps ([#268](https://github.com/ipfs/js-ipfs-unixfs/issues/268)) ([7dac8b5](https://github.com/ipfs/js-ipfs-unixfs/commit/7dac8b5b4916aaf553d045293ee53177fbaf5044))

## [ipfs-unixfs-exporter-v9.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v8.0.6...ipfs-unixfs-exporter-v9.0.0) (2022-10-19)


### ⚠ BREAKING CHANGES

* CIDs returned are instances from `multiformats@10.x.x` and not `multiformats@9.x.x`

### Dependencies

* update multiformats to 10.x.x and all @ipld/* modules ([#265](https://github.com/ipfs/js-ipfs-unixfs/issues/265)) ([7a12568](https://github.com/ipfs/js-ipfs-unixfs/commit/7a1256835d85ab9e4f40dd954217d32fdb241517))

## [ipfs-unixfs-exporter-v8.0.6](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v8.0.5...ipfs-unixfs-exporter-v8.0.6) (2022-09-21)


### Bug Fixes

* prevent OOM on very deep DAGs ([#253](https://github.com/ipfs/js-ipfs-unixfs/issues/253)) ([62494bf](https://github.com/ipfs/js-ipfs-unixfs/commit/62494bf8cdea7b7ea430a6517c526798bc01b747))

## [ipfs-unixfs-exporter-v8.0.5](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v8.0.4...ipfs-unixfs-exporter-v8.0.5) (2022-08-31)


### Bug Fixes

* specify return type of the importer to generate correct types ([#251](https://github.com/ipfs/js-ipfs-unixfs/issues/251)) ([3343366](https://github.com/ipfs/js-ipfs-unixfs/commit/33433660a1f762d3e9b9a431cfb956136821cfb1)), closes [#214](https://github.com/ipfs/js-ipfs-unixfs/issues/214)

## [ipfs-unixfs-exporter-v8.0.4](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v8.0.3...ipfs-unixfs-exporter-v8.0.4) (2022-08-17)


### Bug Fixes

* yield buf after reading length to make it safe to use with worker transfer ([eeeda23](https://github.com/ipfs/js-ipfs-unixfs/commit/eeeda2397ccd2ccebb1de5f34af126d697ac80f5))

## [ipfs-unixfs-exporter-v8.0.3](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v8.0.2...ipfs-unixfs-exporter-v8.0.3) (2022-08-17)


### Bug Fixes

* handle empty files again ([4c1b9f6](https://github.com/ipfs/js-ipfs-unixfs/commit/4c1b9f666a77ffc2bc9f5fbaa6342257052d6e62))

## [ipfs-unixfs-exporter-v8.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v8.0.1...ipfs-unixfs-exporter-v8.0.2) (2022-08-17)


### Bug Fixes

* parallelise loading of dag-pb links when exporting ([#249](https://github.com/ipfs/js-ipfs-unixfs/issues/249)) ([862d63b](https://github.com/ipfs/js-ipfs-unixfs/commit/862d63bc4e158187ff6fb97c680b8886e0d2001a)), closes [#237](https://github.com/ipfs/js-ipfs-unixfs/issues/237)

## [ipfs-unixfs-exporter-v8.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v8.0.0...ipfs-unixfs-exporter-v8.0.1) (2022-08-16)


### Bug Fixes

* update types import path and deps ([#248](https://github.com/ipfs/js-ipfs-unixfs/issues/248)) ([2edd327](https://github.com/ipfs/js-ipfs-unixfs/commit/2edd327bbe25880a83a8ea00963a22e3f9fa4449))

## [ipfs-unixfs-exporter-v8.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v7.0.11...ipfs-unixfs-exporter-v8.0.0) (2022-08-11)


### ⚠ BREAKING CHANGES

* This module used to be dual published as CJS/ESM, now it is just ESM

### Dependencies

* update aegir to 37.x.x ([#243](https://github.com/ipfs/js-ipfs-unixfs/issues/243)) ([9fccb7c](https://github.com/ipfs/js-ipfs-unixfs/commit/9fccb7c4bf989c052ba67ab2c9280273aecfda36))
* update hamt-sharding to 3.0.0 ([#244](https://github.com/ipfs/js-ipfs-unixfs/issues/244)) ([50a7607](https://github.com/ipfs/js-ipfs-unixfs/commit/50a7607d1876dab0b34dfe79704688f01ce1d449))

## [ipfs-unixfs-exporter-v7.0.11](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v7.0.10...ipfs-unixfs-exporter-v7.0.11) (2022-05-27)


### Bug Fixes

* remove typesVersions from package.json ([#219](https://github.com/ipfs/js-ipfs-unixfs/issues/219)) ([465670e](https://github.com/ipfs/js-ipfs-unixfs/commit/465670eab2e707b14b14047e2da4ede23590196e)), closes [#214](https://github.com/ipfs/js-ipfs-unixfs/issues/214) [#161](https://github.com/ipfs/js-ipfs-unixfs/issues/161) [#214](https://github.com/ipfs/js-ipfs-unixfs/issues/214)


### Trivial Changes

* update dep-check command ([#221](https://github.com/ipfs/js-ipfs-unixfs/issues/221)) ([5802bd3](https://github.com/ipfs/js-ipfs-unixfs/commit/5802bd366768e1a024fad30e4190aed866f5c9ec))

## [ipfs-unixfs-exporter-v7.0.10](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v7.0.9...ipfs-unixfs-exporter-v7.0.10) (2022-05-27)


### Bug Fixes

* update deps ([#220](https://github.com/ipfs/js-ipfs-unixfs/issues/220)) ([08e851e](https://github.com/ipfs/js-ipfs-unixfs/commit/08e851e9c0dedf15f3a737157978a767343334f0))

## [ipfs-unixfs-exporter-v7.0.9](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v7.0.8...ipfs-unixfs-exporter-v7.0.9) (2022-05-27)


### Trivial Changes

* bump @ipld/dag-cbor from 6.0.15 to 7.0.2 ([#216](https://github.com/ipfs/js-ipfs-unixfs/issues/216)) ([daeb686](https://github.com/ipfs/js-ipfs-unixfs/commit/daeb68612ab2491f5906a5cb7a9c25fec0b3ce57))
* bump sinon from 11.1.2 to 14.0.0 ([#213](https://github.com/ipfs/js-ipfs-unixfs/issues/213)) ([5ab15c1](https://github.com/ipfs/js-ipfs-unixfs/commit/5ab15c18a412d18fddc18cacc6b0c775320cb814))

## [ipfs-unixfs-exporter-v7.0.8](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v7.0.7...ipfs-unixfs-exporter-v7.0.8) (2022-05-04)


### Bug Fixes

* metadata on small files without raw leaves ([#212](https://github.com/ipfs/js-ipfs-unixfs/issues/212)) ([bef09cd](https://github.com/ipfs/js-ipfs-unixfs/commit/bef09cdb143808305d7947f57eba3aac33298c23))

## [ipfs-unixfs-exporter-v7.0.7](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter-v7.0.6...ipfs-unixfs-exporter-v7.0.7) (2022-04-26)


### Bug Fixes

* do not add metadata to leaves ([#193](https://github.com/ipfs/js-ipfs-unixfs/issues/193)) ([f5d3a67](https://github.com/ipfs/js-ipfs-unixfs/commit/f5d3a670e163632913229a1b75ec12a2d6847326))


### Trivial Changes

* switch to auto-release ([#208](https://github.com/ipfs/js-ipfs-unixfs/issues/208)) ([99386e6](https://github.com/ipfs/js-ipfs-unixfs/commit/99386e61979214e8ef79915800a6ed7154938342))
* update readmes ([#188](https://github.com/ipfs/js-ipfs-unixfs/issues/188)) ([273a141](https://github.com/ipfs/js-ipfs-unixfs/commit/273a141b5ee3805bd0ef2dc8ed7870f8c6c8a820))

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [7.0.6](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@7.0.5...ipfs-unixfs-exporter@7.0.6) (2021-09-14)

**Note:** Version bump only for package ipfs-unixfs-exporter





## [7.0.5](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@7.0.4...ipfs-unixfs-exporter@7.0.5) (2021-08-27)


### Bug Fixes

* declare types in .ts files ([#168](https://github.com/ipfs/js-ipfs-unixfs/issues/168)) ([76ec6e5](https://github.com/ipfs/js-ipfs-unixfs/commit/76ec6e501bcf0b439a2166b80b50e9db0957d377))





## [7.0.4](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@7.0.3...ipfs-unixfs-exporter@7.0.4) (2021-08-25)


### Bug Fixes

* individual packages can use npm 6 ([#167](https://github.com/ipfs/js-ipfs-unixfs/issues/167)) ([2b429cc](https://github.com/ipfs/js-ipfs-unixfs/commit/2b429cc4c0e7362632d9288c58923f1c629d0cd0))





## [7.0.3](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@7.0.2...ipfs-unixfs-exporter@7.0.3) (2021-08-20)


### Bug Fixes

* publish with types in package.json ([#166](https://github.com/ipfs/js-ipfs-unixfs/issues/166)) ([0318c98](https://github.com/ipfs/js-ipfs-unixfs/commit/0318c98ebaefaefff959e71b7371a253ad44eebf))





## [7.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@7.0.1...ipfs-unixfs-exporter@7.0.2) (2021-08-19)

**Note:** Version bump only for package ipfs-unixfs-exporter





## [7.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@7.0.0...ipfs-unixfs-exporter@7.0.1) (2021-08-19)


### Bug Fixes

* types with ipjs build ([#165](https://github.com/ipfs/js-ipfs-unixfs/issues/165)) ([fea85b5](https://github.com/ipfs/js-ipfs-unixfs/commit/fea85b5e63f8c887bc4a2033baecd84b36cc53bf))





# [7.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@6.0.2...ipfs-unixfs-exporter@7.0.0) (2021-08-19)


### chore

* switch to ESM ([#161](https://github.com/ipfs/js-ipfs-unixfs/issues/161)) ([819267f](https://github.com/ipfs/js-ipfs-unixfs/commit/819267f64fe9d4afc89ef729d54d4d15c2e11820)), closes [skypackjs/skypack-cdn#171](https://github.com/skypackjs/skypack-cdn/issues/171)


### BREAKING CHANGES

* ./src/dir-sharded is not in the exports map so cannot be imported

Co-authored-by: Alex Potsides <alex@achingbrain.net>





## [6.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@6.0.1...ipfs-unixfs-exporter@6.0.2) (2021-08-03)


### Bug Fixes

* update import types ([#164](https://github.com/ipfs/js-ipfs-unixfs/issues/164)) ([0bb612d](https://github.com/ipfs/js-ipfs-unixfs/commit/0bb612defa14fea0efd3c799784be688e043edd0))





## [6.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@6.0.0...ipfs-unixfs-exporter@6.0.1) (2021-07-16)

**Note:** Version bump only for package ipfs-unixfs-exporter





# [6.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@5.0.3...ipfs-unixfs-exporter@6.0.0) (2021-07-09)


### Bug Fixes

* use @ipld/dag-pb instead of ipld-dag-pb ([#116](https://github.com/ipfs/js-ipfs-unixfs/issues/116)) ([bab1985](https://github.com/ipfs/js-ipfs-unixfs/commit/bab1985e3f80c17dc94b0e9448ac993bfe78488a))


### BREAKING CHANGES

* uses new multiformats stack and takes a blockservice instead of the block api

Co-authored-by: Rod Vagg <rod@vagg.org>
Co-authored-by: achingbrain <alex@achingbrain.net>





## [5.0.3](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@5.0.2...ipfs-unixfs-exporter@5.0.3) (2021-04-20)

**Note:** Version bump only for package ipfs-unixfs-exporter





## [5.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@5.0.1...ipfs-unixfs-exporter@5.0.2) (2021-04-16)

**Note:** Version bump only for package ipfs-unixfs-exporter





## [5.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@5.0.0...ipfs-unixfs-exporter@5.0.1) (2021-03-19)

**Note:** Version bump only for package ipfs-unixfs-exporter





# [5.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@4.0.1...ipfs-unixfs-exporter@5.0.0) (2021-03-15)


### chore

* declare interface types in .d.ts file ([#122](https://github.com/ipfs/js-ipfs-unixfs/issues/122)) ([eaa8449](https://github.com/ipfs/js-ipfs-unixfs/commit/eaa8449c10abed9d9a378bee544b4ff501666c4b))


### BREAKING CHANGES

* switches to named exports





## [4.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@4.0.0...ipfs-unixfs-exporter@4.0.1) (2021-02-23)


### Bug Fixes

* use ipfs-core-types instead of redefining ipld ([#121](https://github.com/ipfs/js-ipfs-unixfs/issues/121)) ([6cfd51d](https://github.com/ipfs/js-ipfs-unixfs/commit/6cfd51de4f00cf4ee3c6a78c378439b80d0e2c25))





# [4.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@3.0.7...ipfs-unixfs-exporter@4.0.0) (2021-02-18)


### Features

* add types ([#114](https://github.com/ipfs/js-ipfs-unixfs/issues/114)) ([ca26353](https://github.com/ipfs/js-ipfs-unixfs/commit/ca26353081ae192718532d3dbd60779863fe6d53))


### BREAKING CHANGES

* types are now included with all unixfs modules





## [3.0.7](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@3.0.6...ipfs-unixfs-exporter@3.0.7) (2020-11-20)

**Note:** Version bump only for package ipfs-unixfs-exporter





## [3.0.6](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@3.0.5...ipfs-unixfs-exporter@3.0.6) (2020-11-06)

**Note:** Version bump only for package ipfs-unixfs-exporter





## [3.0.5](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@3.0.4...ipfs-unixfs-exporter@3.0.5) (2020-11-04)

**Note:** Version bump only for package ipfs-unixfs-exporter





## [3.0.4](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@3.0.3...ipfs-unixfs-exporter@3.0.4) (2020-09-04)

**Note:** Version bump only for package ipfs-unixfs-exporter





## [3.0.3](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@3.0.2...ipfs-unixfs-exporter@3.0.3) (2020-08-25)

**Note:** Version bump only for package ipfs-unixfs-exporter





## [3.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@3.0.1...ipfs-unixfs-exporter@3.0.2) (2020-08-05)


### Bug Fixes

* replace node buffers with uint8arrays ([#69](https://github.com/ipfs/js-ipfs-unixfs/issues/69)) ([8a5aed2](https://github.com/ipfs/js-ipfs-unixfs/commit/8a5aed2ca76de16778ff37822c058531d4fcdcb5)), closes [#66](https://github.com/ipfs/js-ipfs-unixfs/issues/66)





## [3.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@3.0.0...ipfs-unixfs-exporter@3.0.1) (2020-07-28)

**Note:** Version bump only for package ipfs-unixfs-exporter





# [3.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@2.0.1...ipfs-unixfs-exporter@3.0.0) (2020-07-28)


### Bug Fixes

* ignore high mode bits passed to constructor ([#53](https://github.com/ipfs/js-ipfs-unixfs/issues/53)) ([8e8d83d](https://github.com/ipfs/js-ipfs-unixfs/commit/8e8d83d757276be7e1cb2581abd4b562cb8209e2))


### chore

* remove node buffers from runtime code ([#66](https://github.com/ipfs/js-ipfs-unixfs/issues/66)) ([db60a42](https://github.com/ipfs/js-ipfs-unixfs/commit/db60a4232e600e73227e6ab8964be083eada389a))
* upgrade to dag-pb that supports Uint8Array ([#65](https://github.com/ipfs/js-ipfs-unixfs/issues/65)) ([b8b2ee3](https://github.com/ipfs/js-ipfs-unixfs/commit/b8b2ee324f17c4bb8a7931761aee02d1635b6ca2))


### BREAKING CHANGES

* does not convert input to node Buffers any more, uses Uint8Arrays instead
* dag-pb Links property now returns DAGLink objects





## [2.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@2.0.0...ipfs-unixfs-exporter@2.0.1) (2020-04-24)


### Bug Fixes

* remove node globals ([#52](https://github.com/ipfs/js-ipfs-unixfs/issues/52)) ([5414412](https://github.com/ipfs/js-ipfs-unixfs/commit/5414412b6b228d7922a10210825c9b85b0362af6))





# [2.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@1.1.0...ipfs-unixfs-exporter@2.0.0) (2020-04-23)


### Code Refactoring

* use the block API from ipfs instead of ipld internals ([#51](https://github.com/ipfs/js-ipfs-unixfs/issues/51)) ([cfecf39](https://github.com/ipfs/js-ipfs-unixfs/commit/cfecf390ae2747d2b6c55f4ebd039791f7162fec))


### BREAKING CHANGES

* The importer takes a pin argument (previously undocumented) - it used
to default to true but since this switches to use the block API the
default has changed to false, as the typical usage pattern is to pin
the root block of a DAG recursively instead of every block that makes
up the DAG.





# [1.1.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@1.0.3...ipfs-unixfs-exporter@1.1.0) (2020-04-15)


### Features

* support aborting exports ([#47](https://github.com/ipfs/js-ipfs-unixfs/issues/47)) ([7685e44](https://github.com/ipfs/js-ipfs-unixfs/commit/7685e44ce47b6599d427bf177053fb9e16c43bce))





## [1.0.3](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@1.0.2...ipfs-unixfs-exporter@1.0.3) (2020-03-30)

**Note:** Version bump only for package ipfs-unixfs-exporter





## [1.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@1.0.1...ipfs-unixfs-exporter@1.0.2) (2020-03-09)

**Note:** Version bump only for package ipfs-unixfs-exporter





## [1.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs-exporter@1.0.0...ipfs-unixfs-exporter@1.0.1) (2020-03-03)

**Note:** Version bump only for package ipfs-unixfs-exporter





# 1.0.0 (2020-02-21)

**Note:** Version bump only for package ipfs-unixfs-exporter





<a name="0.41.1"></a>
## [0.41.1](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.41.0...v0.41.1) (2020-02-04)



# [0.41.0](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.40.0...v0.41.0) (2020-01-15)


### Features

* support exporting nodes encoded with the identity hash ([#27](https://github.com/ipfs/js-ipfs-unixfs-exporter/issues/27)) ([4a02ee7](https://github.com/ipfs/js-ipfs-unixfs-exporter/commit/4a02ee7d7095c6761012f31ad2faddcbd9a6d272))



<a name="0.40.0"></a>
# [0.40.0](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.39.0...v0.40.0) (2020-01-08)



<a name="0.39.0"></a>
# [0.39.0](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.38.0...v0.39.0) (2019-11-18)



# [0.38.0](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.37.7...v0.38.0) (2019-08-05)


### Bug Fixes

* update to newest IPLD libraries ([#23](https://github.com/ipfs/js-ipfs-unixfs-exporter/issues/23)) ([03f4069](https://github.com/ipfs/js-ipfs-unixfs-exporter/commit/03f4069))



## [0.37.7](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.37.6...v0.37.7) (2019-06-06)



<a name="0.37.6"></a>
## [0.37.6](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.37.5...v0.37.6) (2019-05-24)



<a name="0.37.5"></a>
## [0.37.5](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.37.4...v0.37.5) (2019-05-24)



<a name="0.37.4"></a>
## [0.37.4](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.37.3...v0.37.4) (2019-05-20)



<a name="0.37.3"></a>
## [0.37.3](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.37.2...v0.37.3) (2019-05-20)



<a name="0.37.2"></a>
## [0.37.2](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.37.1...v0.37.2) (2019-05-20)



<a name="0.37.1"></a>
## [0.37.1](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.37.0...v0.37.1) (2019-05-18)



<a name="0.37.0"></a>
# [0.37.0](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.36.1...v0.37.0) (2019-05-17)


### Features

* convert to async/await ([#21](https://github.com/ipfs/js-ipfs-unixfs-exporter/issues/21)) ([7119a09](https://github.com/ipfs/js-ipfs-unixfs-exporter/commit/7119a09))



<a name="0.36.1"></a>
## [0.36.1](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.36.0...v0.36.1) (2019-03-18)


### Bug Fixes

* make exporter report file sizes without protobuf overhead ([#20](https://github.com/ipfs/js-ipfs-unixfs-exporter/issues/20)) ([8d1bddd](https://github.com/ipfs/js-ipfs-unixfs-exporter/commit/8d1bddd)), closes [ipfs/js-ipfs#1934](https://github.com/ipfs/js-ipfs/issues/1934)



<a name="0.36.0"></a>
# [0.36.0](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.35.9...v0.36.0) (2019-03-08)



## [0.35.9](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.35.8...v0.35.9) (2019-02-06)



<a name="0.35.8"></a>
## [0.35.8](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.35.7...v0.35.8) (2019-01-16)



<a name="0.35.7"></a>
## [0.35.7](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.35.6...v0.35.7) (2019-01-04)



<a name="0.35.6"></a>
## [0.35.6](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.35.5...v0.35.6) (2018-12-19)



<a name="0.35.5"></a>
## [0.35.5](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.35.4...v0.35.5) (2018-12-04)


### Bug Fixes

* fix regext to not match square brackets ([667f6e9](https://github.com/ipfs/js-ipfs-unixfs-exporter/commit/667f6e9))



<a name="0.35.4"></a>
## [0.35.4](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.35.3...v0.35.4) (2018-12-03)



<a name="0.35.3"></a>
## [0.35.3](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.35.2...v0.35.3) (2018-12-03)


### Performance Improvements

* only descend into hamt subshard that has the target entry ([fdad329](https://github.com/ipfs/js-ipfs-unixfs-exporter/commit/fdad329)), closes [#9](https://github.com/ipfs/js-ipfs-unixfs-exporter/issues/9)



<a name="0.35.2"></a>
## [0.35.2](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.35.1...v0.35.2) (2018-12-02)


### Performance Improvements

* deep require pull stream modules ([8dc4211](https://github.com/ipfs/js-ipfs-unixfs-exporter/commit/8dc4211))



<a name="0.35.1"></a>
## [0.35.1](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.35.0...v0.35.1) (2018-11-29)


### Performance Improvements

* do not descend into subtrees ([cca3531](https://github.com/ipfs/js-ipfs-unixfs-exporter/commit/cca3531))



<a name="0.35.0"></a>
# [0.35.0](https://github.com/ipfs/js-ipfs-unixfs-exporter/compare/v0.34.0...v0.35.0) (2018-11-23)


### Bug Fixes

* export all files from hamt sharded directories ([4add865](https://github.com/ipfs/js-ipfs-unixfs-exporter/commit/4add865))
* increase test timeout ([0ae27e1](https://github.com/ipfs/js-ipfs-unixfs-exporter/commit/0ae27e1))
* support slashes in filenames ([b69abce](https://github.com/ipfs/js-ipfs-unixfs-exporter/commit/b69abce))
* use dag.getMany to avoid overloading the DHT, when it arrives ([f479d28](https://github.com/ipfs/js-ipfs-unixfs-exporter/commit/f479d28)), closes [ipfs/js-ipfs-unixfs-engine#216](https://github.com/ipfs/js-ipfs-unixfs-engine/issues/216)


### Features

* add `fullPath` option ([21dd221](https://github.com/ipfs/js-ipfs-unixfs-exporter/commit/21dd221))



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
