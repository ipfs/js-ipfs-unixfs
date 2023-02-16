
async function * randomByteStream (seed: number): AsyncGenerator<Uint8Array> {
  while (true) {
    const r = Math.floor(random(seed) * 256)
    seed = r

    yield Uint8Array.from([r])
  }
}

function random (seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export default randomByteStream
