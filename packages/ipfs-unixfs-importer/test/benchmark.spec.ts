/* eslint-env mocha */

import { importer } from '../src/index.js'
import bufferStream from 'it-buffer-stream'
import { MemoryBlockstore } from 'blockstore-core'
import drain from 'it-drain'

const REPEATS = 10
const FILE_SIZE = Math.pow(2, 20) * 500 // 500MB
const CHUNK_SIZE = 65536

describe.skip('benchmark', function () {
  this.timeout(30 * 1000)

  const block = new MemoryBlockstore()

  const times: number[] = []

  after(() => {
    console.info('Percent\tms') // eslint-disable-line no-console
    times.forEach((time, index) => {
      console.info(`${index}\t${Math.round(time / REPEATS)}`) // eslint-disable-line no-console
    })
  })

  for (let i = 0; i < REPEATS; i++) {
    it(`run ${i}`, async () => { // eslint-disable-line no-loop-func
      this.timeout(0)

      const size = FILE_SIZE
      let read = 0
      let lastDate = Date.now()
      let lastPercent = 0

      const options = {
        progress: (prog: number) => {
          read += prog

          const percent = Math.round((read / size) * 100)

          if (percent > lastPercent) {
            times[percent] = (times[percent] ?? 0) + (Date.now() - lastDate)

            lastDate = Date.now()
            lastPercent = percent
          }
        }
      }

      const buf = new Uint8Array(CHUNK_SIZE).fill(0)

      await drain(importer([{
        path: '200Bytes.txt',
        content: bufferStream(size, {
          chunkSize: CHUNK_SIZE,
          generator: () => {
            return buf
          }
        })
      }], block, options))
    })
  }
})
