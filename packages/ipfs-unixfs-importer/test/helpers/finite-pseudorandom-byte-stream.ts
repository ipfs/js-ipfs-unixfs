const REPEATABLE_CHUNK_SIZE = 300000

async function * stream (maxSize: number, seed: number): AsyncGenerator<Uint8Array> {
  const chunks = Math.ceil(maxSize / REPEATABLE_CHUNK_SIZE)
  let emitted = 0
  const buf = new Uint8Array(REPEATABLE_CHUNK_SIZE)

  while (emitted !== chunks) {
    for (let i = 0; i < buf.length; i++) {
      buf[i] = 256 & Math.floor(random(seed) * 256)
    }

    yield buf

    emitted++
  }
}

export default stream

function random (seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}
