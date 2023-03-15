# Memory Benchmark

How much memory does the importer use while importing files?

It should be relatively flat to enable importing files larger than physical memory.

## Usage

```console
$ npm i
$ npm start

> benchmarks-gc@1.0.0 start
> npm run build && node dist/src/index.js


> benchmarks-gc@1.0.0 build
> aegir build --bundle false

[14:51:28] tsc [started]
[14:51:33] tsc [completed]
generating Ed25519 keypair...
┌─────────┬────────────────┬─────────┬───────────┬──────┐
│ (index) │ Implementation │  ops/s  │   ms/op   │ runs │
├─────────┼────────────────┼─────────┼───────────┼──────┤
//... results here
```
