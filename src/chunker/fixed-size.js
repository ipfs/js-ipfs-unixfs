'use strict'

const BufferList = require('bl')
const through = require('pull-through')

module.exports = (options) => {
  let maxSize = (typeof options === 'number') ? options : options.maxChunkSize
  let bl = new BufferList()
  let currentLength = 0
  let emitted = false

  return through(
    function onData (buffer) {
      bl.append(buffer)

      currentLength += buffer.length

      while (currentLength >= maxSize) {
        this.queue(bl.slice(0, maxSize))

        emitted = true

        // throw away consumed bytes
        if (maxSize === bl.length) {
          bl = new BufferList()
          currentLength = 0
        } else {
          const newBl = new BufferList()
          newBl.append(bl.shallowSlice(maxSize))
          bl = newBl

          // update our offset
          currentLength -= maxSize
        }
      }
    },
    function onEnd () {
      if (currentLength) {
        this.queue(bl.slice(0, currentLength))
        emitted = true
      }

      if (!emitted) {
        this.queue(Buffer.alloc(0))
      }

      this.queue(null)
    }
  )
}
