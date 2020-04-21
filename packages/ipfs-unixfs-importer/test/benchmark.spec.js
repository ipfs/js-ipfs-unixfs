/* eslint-env mocha */
'use strict'

const { Buffer } = require('buffer')
const importer = require('../src')

const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const bufferStream = require('it-buffer-stream')
const all = require('it-all')

const REPEATS = 10
const FILE_SIZE = Math.pow(2, 20) * 500 // 500MB
const CHUNK_SIZE = 65536

describe.skip('benchmark', function () {
  this.timeout(30 * 1000)

  let ipld

  before(async () => {
    ipld = await inMemory(IPLD)
  })

  const times = []

  after(() => {
    console.info('Percent\tms') // eslint-disable-line no-console
    times.forEach((time, index) => {
      console.info(`${index}\t${parseInt(time / REPEATS)}`) // eslint-disable-line no-console
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
        progress: (prog) => {
          read += prog

          const percent = parseInt((read / size) * 100)

          if (percent > lastPercent) {
            times[percent] = (times[percent] || 0) + (Date.now() - lastDate)

            lastDate = Date.now()
            lastPercent = percent
          }
        }
      }

      const buf = Buffer.alloc(CHUNK_SIZE).fill(0)

      await all(importer([{
        path: '200Bytes.txt',
        content: bufferStream(size, {
          chunkSize: CHUNK_SIZE,
          generator: () => {
            return buf
          }
        })
      }], ipld, options))
    })
  }
})
