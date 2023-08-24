async function * asAsyncIterable (arr: Uint8Array | Uint8Array[]): AsyncGenerator<Uint8Array, void, undefined> {
  if (!Array.isArray(arr)) {
    arr = [arr]
  }

  yield * arr
}

export default asAsyncIterable
