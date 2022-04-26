## ipfs-unixfs-v1.0.0 (2022-04-26)


### ⚠ BREAKING CHANGES

* ./src/dir-sharded is not in the exports map so cannot be imported

Co-authored-by: Alex Potsides <alex@achingbrain.net>
* uses new multiformats stack and takes a blockservice instead of the block api

Co-authored-by: Rod Vagg <rod@vagg.org>
Co-authored-by: achingbrain <alex@achingbrain.net>
* switches to named exports
* types are now included with all unixfs modules
* does not convert input to node Buffers any more, uses Uint8Arrays instead

### Features

* add types ([#114](https://github.com/ipfs/js-ipfs-unixfs/issues/114)) ([ca26353](https://github.com/ipfs/js-ipfs-unixfs/commit/ca26353081ae192718532d3dbd60779863fe6d53))


### Bug Fixes

* add pbjs namespace ([#145](https://github.com/ipfs/js-ipfs-unixfs/issues/145)) ([dd26b92](https://github.com/ipfs/js-ipfs-unixfs/commit/dd26b92606a935d08221a0bf6709a4954d864259))
* declare types in .ts files ([#168](https://github.com/ipfs/js-ipfs-unixfs/issues/168)) ([76ec6e5](https://github.com/ipfs/js-ipfs-unixfs/commit/76ec6e501bcf0b439a2166b80b50e9db0957d377))
* ignore high mode bits passed to constructor ([#53](https://github.com/ipfs/js-ipfs-unixfs/issues/53)) ([8e8d83d](https://github.com/ipfs/js-ipfs-unixfs/commit/8e8d83d757276be7e1cb2581abd4b562cb8209e2))
* ignore undefined values in options ([#173](https://github.com/ipfs/js-ipfs-unixfs/issues/173)) ([200dff3](https://github.com/ipfs/js-ipfs-unixfs/commit/200dff3e3e7c64491f5e5352e3d734308f80d3b6))
* individual packages can use npm 6 ([#167](https://github.com/ipfs/js-ipfs-unixfs/issues/167)) ([2b429cc](https://github.com/ipfs/js-ipfs-unixfs/commit/2b429cc4c0e7362632d9288c58923f1c629d0cd0))
* publish with types in package.json ([#166](https://github.com/ipfs/js-ipfs-unixfs/issues/166)) ([0318c98](https://github.com/ipfs/js-ipfs-unixfs/commit/0318c98ebaefaefff959e71b7371a253ad44eebf))
* remove node globals ([#52](https://github.com/ipfs/js-ipfs-unixfs/issues/52)) ([5414412](https://github.com/ipfs/js-ipfs-unixfs/commit/5414412b6b228d7922a10210825c9b85b0362af6))
* replace node buffers with uint8arrays ([#69](https://github.com/ipfs/js-ipfs-unixfs/issues/69)) ([8a5aed2](https://github.com/ipfs/js-ipfs-unixfs/commit/8a5aed2ca76de16778ff37822c058531d4fcdcb5)), closes [#66](https://github.com/ipfs/js-ipfs-unixfs/issues/66)
* types with ipjs build ([#165](https://github.com/ipfs/js-ipfs-unixfs/issues/165)) ([fea85b5](https://github.com/ipfs/js-ipfs-unixfs/commit/fea85b5e63f8c887bc4a2033baecd84b36cc53bf))
* use @ipld/dag-pb instead of ipld-dag-pb ([#116](https://github.com/ipfs/js-ipfs-unixfs/issues/116)) ([bab1985](https://github.com/ipfs/js-ipfs-unixfs/commit/bab1985e3f80c17dc94b0e9448ac993bfe78488a))


### Trivial Changes

* add travis file and configure build scripts ([5a25c87](https://github.com/ipfs/js-ipfs-unixfs/commit/5a25c874d767893778270b24be2afe562b970918))
* consolidate .gitignore files ([b05e468](https://github.com/ipfs/js-ipfs-unixfs/commit/b05e46823b557f7a46f2e4dc3f8d0ec922c32051))
* declare interface types in .d.ts file ([#122](https://github.com/ipfs/js-ipfs-unixfs/issues/122)) ([eaa8449](https://github.com/ipfs/js-ipfs-unixfs/commit/eaa8449c10abed9d9a378bee544b4ff501666c4b))
* dep updates ([cf9480b](https://github.com/ipfs/js-ipfs-unixfs/commit/cf9480b48ad814c463b580df3d63681f8f28d005))
* **deps-dev:** bump aegir from 26.0.0 to 28.1.0 ([#86](https://github.com/ipfs/js-ipfs-unixfs/issues/86)) ([87541c7](https://github.com/ipfs/js-ipfs-unixfs/commit/87541c7823fd9061c08f9edc1741aab03c6b9464))
* **deps-dev:** bump aegir from 28.2.0 to 29.2.2 ([#101](https://github.com/ipfs/js-ipfs-unixfs/issues/101)) ([010ab47](https://github.com/ipfs/js-ipfs-unixfs/commit/010ab4757e2058dbf610fb18ad347370a6a1c88b))
* exclude docs and tests from npm package ([63b8ba0](https://github.com/ipfs/js-ipfs-unixfs/commit/63b8ba05e032abdf53228a6aa73f1a9680076c8a))
* move files into packages folder ([943be9d](https://github.com/ipfs/js-ipfs-unixfs/commit/943be9d8ddf9973416fb4113407bb15344bfec47))
* publish ([5203595](https://github.com/ipfs/js-ipfs-unixfs/commit/5203595ad8e700be94cfc57d289d7d6f95fa6e3e))
* publish ([0f9092e](https://github.com/ipfs/js-ipfs-unixfs/commit/0f9092e49deb6cbad08b38651be17da93486c00a))
* publish ([2713329](https://github.com/ipfs/js-ipfs-unixfs/commit/2713329ef7db782ef880cedb2aa4784f4ebe0f9a))
* publish ([35e2059](https://github.com/ipfs/js-ipfs-unixfs/commit/35e20596b79a961f8dd824e93ceeb0ec77531a73))
* publish ([137a4ad](https://github.com/ipfs/js-ipfs-unixfs/commit/137a4add12838cff6d5a6f8c8ca60289da69d8df))
* publish ([f173850](https://github.com/ipfs/js-ipfs-unixfs/commit/f1738509735369311737756f5fe919fb0320757c))
* publish ([2ea467f](https://github.com/ipfs/js-ipfs-unixfs/commit/2ea467f79e7d57462a2cb8edb5c0bec044057535))
* publish ([dedbd82](https://github.com/ipfs/js-ipfs-unixfs/commit/dedbd82c3ac4f6f1dc40cd084453b627abdcfc36))
* publish ([dc2d400](https://github.com/ipfs/js-ipfs-unixfs/commit/dc2d40013fecca7bdfa72161c7a43b0a3cffb27b))
* publish ([27d57df](https://github.com/ipfs/js-ipfs-unixfs/commit/27d57df7c526806a01d2df0cacee3c15098d8dab))
* publish ([5ccac2f](https://github.com/ipfs/js-ipfs-unixfs/commit/5ccac2f40bc582d594ac8ec761696df78d1fd351))
* publish ([172548b](https://github.com/ipfs/js-ipfs-unixfs/commit/172548bf5f5ecf2c6fd6f410be506ccd72804d28))
* publish ([9a2b5f2](https://github.com/ipfs/js-ipfs-unixfs/commit/9a2b5f290205a9488f2d131a40965505db521bf0))
* publish ([e57ba16](https://github.com/ipfs/js-ipfs-unixfs/commit/e57ba169ab16ce4f36fd1f553e6d4d08f82e6a35))
* publish ([9e8f077](https://github.com/ipfs/js-ipfs-unixfs/commit/9e8f0774d0b043206008ce05480b0a1a200541f3))
* publish ([22e29bb](https://github.com/ipfs/js-ipfs-unixfs/commit/22e29bb212b7843a4edcda2ba86c5dfdfe87b93b))
* publish ([dabbb48](https://github.com/ipfs/js-ipfs-unixfs/commit/dabbb4851166360f60e128968ae15b5a73eeea46))
* publish ([32e5165](https://github.com/ipfs/js-ipfs-unixfs/commit/32e5165ac3c32f2585f8fd6076f25a79b5be4c4b))
* publish ([5d3f4bd](https://github.com/ipfs/js-ipfs-unixfs/commit/5d3f4bd8b77521c47f64f34ed6bab094d418284f))
* publish ([49c8c54](https://github.com/ipfs/js-ipfs-unixfs/commit/49c8c54a136d8b2fdfd4795de460b5e2eb374e86))
* publish ([db2c878](https://github.com/ipfs/js-ipfs-unixfs/commit/db2c8786345feb0f076d3f700cb6520e54c0a75f))
* publish ([9237250](https://github.com/ipfs/js-ipfs-unixfs/commit/9237250f5559727ec250b2152a7f29414831e4e9))
* remove changes from readme ([7c727ef](https://github.com/ipfs/js-ipfs-unixfs/commit/7c727ef82d9d4cf52e21a5271d7ef013054ba31f))
* remove node buffers from runtime code ([#66](https://github.com/ipfs/js-ipfs-unixfs/issues/66)) ([db60a42](https://github.com/ipfs/js-ipfs-unixfs/commit/db60a4232e600e73227e6ab8964be083eada389a))
* remove redundant test files ([3078608](https://github.com/ipfs/js-ipfs-unixfs/commit/3078608d4875fe8d3c2d450b000f57673c962372))
* small readme change ([f45436c](https://github.com/ipfs/js-ipfs-unixfs/commit/f45436c6eff6c2024513dafaf5730ec7e8b07e1c))
* swap to prereleaseOnly ([efb01ac](https://github.com/ipfs/js-ipfs-unixfs/commit/efb01ac61e66f06a1a6ec41a9e98e8140cfa31dc))
* switch to auto-release ([#208](https://github.com/ipfs/js-ipfs-unixfs/issues/208)) ([99386e6](https://github.com/ipfs/js-ipfs-unixfs/commit/99386e61979214e8ef79915800a6ed7154938342))
* switch to ESM ([#161](https://github.com/ipfs/js-ipfs-unixfs/issues/161)) ([819267f](https://github.com/ipfs/js-ipfs-unixfs/commit/819267f64fe9d4afc89ef729d54d4d15c2e11820)), closes [skypackjs/skypack-cdn#171](https://github.com/skypackjs/skypack-cdn/issues/171)
* tighten up input types ([#133](https://github.com/ipfs/js-ipfs-unixfs/issues/133)) ([47f295b](https://github.com/ipfs/js-ipfs-unixfs/commit/47f295bb9c274c16cfaa201831685d55567c18ac))
* update build scripts ([37d96ee](https://github.com/ipfs/js-ipfs-unixfs/commit/37d96ee81d9bf87c1039f25ada4a71c7f3634fb5))
* update deps ([#144](https://github.com/ipfs/js-ipfs-unixfs/issues/144)) ([f5f5fe4](https://github.com/ipfs/js-ipfs-unixfs/commit/f5f5fe43fac8869483cca66e9588593b04b8fa16))
* update deps ([#78](https://github.com/ipfs/js-ipfs-unixfs/issues/78)) ([2bf5d07](https://github.com/ipfs/js-ipfs-unixfs/commit/2bf5d07d2fa6ade7404374a46647d5f852905993))
* update lockfiles ([9d11252](https://github.com/ipfs/js-ipfs-unixfs/commit/9d112523da7e713776d008215623a7245871f844))
* update package.json scripts and readmes ([bda3717](https://github.com/ipfs/js-ipfs-unixfs/commit/bda3717673243f0b845e471fc5727a32e46b0c78))
* update readme ([a012f22](https://github.com/ipfs/js-ipfs-unixfs/commit/a012f22cf08683f9d6d5a3ddf34baf39ee29e24a))
* update readme ([7f93da1](https://github.com/ipfs/js-ipfs-unixfs/commit/7f93da1d174205fe398ca9c3e3920b873b9f6c5a))
* update readmes ([#188](https://github.com/ipfs/js-ipfs-unixfs/issues/188)) ([273a141](https://github.com/ipfs/js-ipfs-unixfs/commit/273a141b5ee3805bd0ef2dc8ed7870f8c6c8a820))
* upgrade deps ([3a43e92](https://github.com/ipfs/js-ipfs-unixfs/commit/3a43e92f6b0e60132f5906d43c0508a3d276f41b))
* use npm 7 workspaces instead of lerna bootstrap ([#120](https://github.com/ipfs/js-ipfs-unixfs/issues/120)) ([1ceb097](https://github.com/ipfs/js-ipfs-unixfs/commit/1ceb0976000b093b84970bfbdb2c575cbff34406))

# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.0.6](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@6.0.5...ipfs-unixfs@6.0.6) (2021-09-14)


### Bug Fixes

* ignore undefined values in options ([#173](https://github.com/ipfs/js-ipfs-unixfs/issues/173)) ([200dff3](https://github.com/ipfs/js-ipfs-unixfs/commit/200dff3e3e7c64491f5e5352e3d734308f80d3b6))





## [6.0.5](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@6.0.4...ipfs-unixfs@6.0.5) (2021-08-27)


### Bug Fixes

* declare types in .ts files ([#168](https://github.com/ipfs/js-ipfs-unixfs/issues/168)) ([76ec6e5](https://github.com/ipfs/js-ipfs-unixfs/commit/76ec6e501bcf0b439a2166b80b50e9db0957d377))





## [6.0.4](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@6.0.3...ipfs-unixfs@6.0.4) (2021-08-25)


### Bug Fixes

* individual packages can use npm 6 ([#167](https://github.com/ipfs/js-ipfs-unixfs/issues/167)) ([2b429cc](https://github.com/ipfs/js-ipfs-unixfs/commit/2b429cc4c0e7362632d9288c58923f1c629d0cd0))





## [6.0.3](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@6.0.2...ipfs-unixfs@6.0.3) (2021-08-20)


### Bug Fixes

* publish with types in package.json ([#166](https://github.com/ipfs/js-ipfs-unixfs/issues/166)) ([0318c98](https://github.com/ipfs/js-ipfs-unixfs/commit/0318c98ebaefaefff959e71b7371a253ad44eebf))





## [6.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@6.0.1...ipfs-unixfs@6.0.2) (2021-08-19)

**Note:** Version bump only for package ipfs-unixfs





## [6.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@6.0.0...ipfs-unixfs@6.0.1) (2021-08-19)


### Bug Fixes

* types with ipjs build ([#165](https://github.com/ipfs/js-ipfs-unixfs/issues/165)) ([fea85b5](https://github.com/ipfs/js-ipfs-unixfs/commit/fea85b5e63f8c887bc4a2033baecd84b36cc53bf))





# [6.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@5.0.0...ipfs-unixfs@6.0.0) (2021-08-19)


### chore

* switch to ESM ([#161](https://github.com/ipfs/js-ipfs-unixfs/issues/161)) ([819267f](https://github.com/ipfs/js-ipfs-unixfs/commit/819267f64fe9d4afc89ef729d54d4d15c2e11820)), closes [skypackjs/skypack-cdn#171](https://github.com/skypackjs/skypack-cdn/issues/171)


### BREAKING CHANGES

* ./src/dir-sharded is not in the exports map so cannot be imported

Co-authored-by: Alex Potsides <alex@achingbrain.net>





# [5.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@4.0.3...ipfs-unixfs@5.0.0) (2021-07-09)


### Bug Fixes

* use @ipld/dag-pb instead of ipld-dag-pb ([#116](https://github.com/ipfs/js-ipfs-unixfs/issues/116)) ([bab1985](https://github.com/ipfs/js-ipfs-unixfs/commit/bab1985e3f80c17dc94b0e9448ac993bfe78488a))


### BREAKING CHANGES

* uses new multiformats stack and takes a blockservice instead of the block api

Co-authored-by: Rod Vagg <rod@vagg.org>
Co-authored-by: achingbrain <alex@achingbrain.net>





## [4.0.3](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@4.0.2...ipfs-unixfs@4.0.3) (2021-04-20)


### Bug Fixes

* add pbjs namespace ([#145](https://github.com/ipfs/js-ipfs-unixfs/issues/145)) ([dd26b92](https://github.com/ipfs/js-ipfs-unixfs/commit/dd26b92606a935d08221a0bf6709a4954d864259))





## [4.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@4.0.1...ipfs-unixfs@4.0.2) (2021-04-16)

**Note:** Version bump only for package ipfs-unixfs





## [4.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@4.0.0...ipfs-unixfs@4.0.1) (2021-03-19)

**Note:** Version bump only for package ipfs-unixfs





# [4.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@3.0.1...ipfs-unixfs@4.0.0) (2021-03-15)


### chore

* declare interface types in .d.ts file ([#122](https://github.com/ipfs/js-ipfs-unixfs/issues/122)) ([eaa8449](https://github.com/ipfs/js-ipfs-unixfs/commit/eaa8449c10abed9d9a378bee544b4ff501666c4b))


### BREAKING CHANGES

* switches to named exports





## [3.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@3.0.0...ipfs-unixfs@3.0.1) (2021-02-23)

**Note:** Version bump only for package ipfs-unixfs





# [3.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@2.0.4...ipfs-unixfs@3.0.0) (2021-02-18)


### Features

* add types ([#114](https://github.com/ipfs/js-ipfs-unixfs/issues/114)) ([ca26353](https://github.com/ipfs/js-ipfs-unixfs/commit/ca26353081ae192718532d3dbd60779863fe6d53))


### BREAKING CHANGES

* types are now included with all unixfs modules





## [2.0.4](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@2.0.3...ipfs-unixfs@2.0.4) (2020-11-04)

**Note:** Version bump only for package ipfs-unixfs





## [2.0.3](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@2.0.2...ipfs-unixfs@2.0.3) (2020-08-25)

**Note:** Version bump only for package ipfs-unixfs





## [2.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@2.0.1...ipfs-unixfs@2.0.2) (2020-08-05)


### Bug Fixes

* replace node buffers with uint8arrays ([#69](https://github.com/ipfs/js-ipfs-unixfs/issues/69)) ([8a5aed2](https://github.com/ipfs/js-ipfs-unixfs/commit/8a5aed2ca76de16778ff37822c058531d4fcdcb5)), closes [#66](https://github.com/ipfs/js-ipfs-unixfs/issues/66)





## [2.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@2.0.0...ipfs-unixfs@2.0.1) (2020-07-28)

**Note:** Version bump only for package ipfs-unixfs





# [2.0.0](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@1.0.2...ipfs-unixfs@2.0.0) (2020-07-28)


### Bug Fixes

* ignore high mode bits passed to constructor ([#53](https://github.com/ipfs/js-ipfs-unixfs/issues/53)) ([8e8d83d](https://github.com/ipfs/js-ipfs-unixfs/commit/8e8d83d757276be7e1cb2581abd4b562cb8209e2))


### chore

* remove node buffers from runtime code ([#66](https://github.com/ipfs/js-ipfs-unixfs/issues/66)) ([db60a42](https://github.com/ipfs/js-ipfs-unixfs/commit/db60a4232e600e73227e6ab8964be083eada389a))


### BREAKING CHANGES

* does not convert input to node Buffers any more, uses Uint8Arrays instead





## [1.0.2](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@1.0.1...ipfs-unixfs@1.0.2) (2020-04-24)


### Bug Fixes

* remove node globals ([#52](https://github.com/ipfs/js-ipfs-unixfs/issues/52)) ([5414412](https://github.com/ipfs/js-ipfs-unixfs/commit/5414412b6b228d7922a10210825c9b85b0362af6))





## [1.0.1](https://github.com/ipfs/js-ipfs-unixfs/compare/ipfs-unixfs@1.0.0...ipfs-unixfs@1.0.1) (2020-03-30)

**Note:** Version bump only for package ipfs-unixfs





# 1.0.0 (2020-02-21)

**Note:** Version bump only for package ipfs-unixfs





# [0.3.0](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.2.0...v0.3.0) (2020-01-08)


### Bug Fixes

* address PR comments, refactor to modern class ([45b0b30](https://github.com/ipfs/js-ipfs-unixfs/commit/45b0b30427ed7471a9df681c72528a54243534b5))
* allow mtime and mode to be optional ([00e5ea0](https://github.com/ipfs/js-ipfs-unixfs/commit/00e5ea0567b4a3441b0b908b252de3eeac099805))
* mask file mode ([#39](https://github.com/ipfs/js-ipfs-unixfs/issues/39)) ([09fd4ed](https://github.com/ipfs/js-ipfs-unixfs/commit/09fd4edfd01c1744052f8db1c36f9641e865507b))
* remove boolean trap constructor and update readme ([9517501](https://github.com/ipfs/js-ipfs-unixfs/commit/9517501c325887fa80db8deca6ee8cb967473314))
* unsaved file buffer ([04ea7a1](https://github.com/ipfs/js-ipfs-unixfs/commit/04ea7a1fc61b0b6ce5035d65253675e2b4908b33))
* update protons to latest version ([e232acf](https://github.com/ipfs/js-ipfs-unixfs/commit/e232acf8f1f2c45c6eae791468c56c844f185d82))
* use correct field index ([397931e](https://github.com/ipfs/js-ipfs-unixfs/commit/397931ee0bd0e28055c51f006234788b2e2b6d57))
* values are required, containing types are not ([3a86a0b](https://github.com/ipfs/js-ipfs-unixfs/commit/3a86a0b5b2801b7429c88b986c96f92c89baf694))


### Features

* return mtime as Date object ([a6c4208](https://github.com/ipfs/js-ipfs-unixfs/commit/a6c4208566632b6e718b0bd3b9a9999cab0e3dc2))
* store time as timespec ([#40](https://github.com/ipfs/js-ipfs-unixfs/issues/40)) ([8adc245](https://github.com/ipfs/js-ipfs-unixfs/commit/8adc2458747e81cb15703c83cd29fa82c635ec8c))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.16...v0.2.0) (2019-11-18)


### Features

* adds metadata to unixfs ([540f20a](https://github.com/ipfs/js-ipfs-unixfs/commit/540f20a))



<a name="0.1.16"></a>
## [0.1.16](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.15...v0.1.16) (2018-10-26)



<a name="0.1.15"></a>
## [0.1.15](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.14...v0.1.15) (2018-06-08)


### Bug Fixes

* a typo ([932b804](https://github.com/ipfs/js-ipfs-unixfs/commit/932b804))



<a name="0.1.14"></a>
## [0.1.14](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.13...v0.1.14) (2017-11-07)



<a name="0.1.13"></a>
## [0.1.13](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.12...v0.1.13) (2017-09-07)


### Features

* migrate out of protocol-buffers and into protons ([32deddc](https://github.com/ipfs/js-ipfs-unixfs/commit/32deddc))



<a name="0.1.12"></a>
## [0.1.12](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.11...v0.1.12) (2017-06-16)


### Bug Fixes

* dirs shouldn't have file size ([#16](https://github.com/ipfs/js-ipfs-unixfs/issues/16)) ([6df8579](https://github.com/ipfs/js-ipfs-unixfs/commit/6df8579))



<a name="0.1.11"></a>
## [0.1.11](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.10...v0.1.11) (2017-03-09)



<a name="0.1.10"></a>
## [0.1.10](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.9...v0.1.10) (2017-02-09)



<a name="0.1.9"></a>
## [0.1.9](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.8...v0.1.9) (2016-12-13)



<a name="0.1.8"></a>
## [0.1.8](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.7...v0.1.8) (2016-11-26)


### Bug Fixes

* regression of regression ([91931f4](https://github.com/ipfs/js-ipfs-unixfs/commit/91931f4))



<a name="0.1.7"></a>
## [0.1.7](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.6...v0.1.7) (2016-11-26)



<a name="0.1.6"></a>
## [0.1.6](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.5...v0.1.6) (2016-11-26)


### Bug Fixes

* update breaking dep (protocol-buffers) ([42a16f8](https://github.com/ipfs/js-ipfs-unixfs/commit/42a16f8))



<a name="0.1.5"></a>
## [0.1.5](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.1...v0.1.5) (2016-11-03)



<a name="0.1.1"></a>
## [0.1.1](https://github.com/ipfs/js-ipfs-unixfs/compare/v0.1.0...v0.1.1) (2016-02-24)



<a name="0.1.0"></a>
# 0.1.0 (2016-02-10)
