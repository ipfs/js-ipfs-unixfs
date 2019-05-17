'use strict'

module.exports = async function * randomByteStream (seed) {
  while (true) {
    const r = Math.floor(random(seed) * 256)
    seed = r

    yield Buffer.from([r])
  }
}

function random (seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}
