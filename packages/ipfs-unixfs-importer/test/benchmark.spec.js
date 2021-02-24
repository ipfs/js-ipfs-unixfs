/* eslint-env mocha */
'use strict'

const { importer } = require('../src')

const bufferStream = require('it-buffer-stream')
const blockApi = require('./helpers/block')

const REPEATS = 10
const FILE_SIZE = Math.pow(2, 20) * 500 // 500MB
const CHUNK_SIZE = 65536

describe.skip('benchmark', function () {
  this.timeout(30 * 1000)

  /** @type {import('../src').BlockAPI} */
  const block = blockApi()

  /** @type {number[]} */
  const times = []

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
        /**
         * @param {number} prog
         */
        progress: (prog) => {
          read += prog

          const percent = Math.round((read / size) * 100)

          if (percent > lastPercent) {
            times[percent] = (times[percent] || 0) + (Date.now() - lastDate)

            lastDate = Date.now()
            lastPercent = percent
          }
        }
      }

      const buf = new Uint8Array(CHUNK_SIZE).fill(0)

      await importer([{
        path: '200Bytes.txt',
        content: bufferStream(size, {
          chunkSize: CHUNK_SIZE,
          generator: () => {
            return buf
          }
        })
      }], block, options)
    })
  }
})
