'use strict'

module.exports = function randomByteStream (_seed) {
  let seed = _seed
  return (end, cb) => {
    if (end) {
      cb(end)
    } else {
      const r = Math.floor(random(seed) * 256)
      seed = r
      cb(null, Buffer.from([r]))
    }
  }
}

function random (seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}
