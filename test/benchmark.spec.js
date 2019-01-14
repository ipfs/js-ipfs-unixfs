/* eslint-env mocha */
'use strict'

const importer = require('../src')

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const pull = require('pull-stream/pull')
const values = require('pull-stream/sources/values')
const onEnd = require('pull-stream/sinks/on-end')
const IPLD = require('ipld')
const inMemory = require('ipld-in-memory')
const bufferStream = require('pull-buffer-stream')

const REPEATS = 10
const FILE_SIZE = Math.pow(2, 20) * 500 // 500MB
const CHUNK_SIZE = 65536

describe.skip('benchmark', function () {
  this.timeout(30 * 1000)

  let ipld

  before((done) => {
    inMemory(IPLD, (err, resolver) => {
      expect(err).to.not.exist()

      ipld = resolver

      done()
    })
  })

  const times = []

  after(() => {
    console.info(`Percent\tms`)
    times.forEach((time, index) => {
      console.info(`${index}\t${parseInt(time / REPEATS)}`)
    })
  })

  for (let i = 0; i < REPEATS; i++) {
    it(`run ${i}`, (done) => { // eslint-disable-line no-loop-func
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

      pull(
        values([{
          path: '200Bytes.txt',
          content: bufferStream(size, {
            chunkSize: CHUNK_SIZE,
            generator: (num, cb) => {
              cb(null, buf)
            }
          })
        }]),
        importer(ipld, options),
        onEnd((err) => {
          expect(err).to.not.exist()
          done()
        })
      )
    })
  }
})
