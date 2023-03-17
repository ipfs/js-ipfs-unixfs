/* eslint-env mocha */

import { importer, ImporterOptions } from 'ipfs-unixfs-importer'
import bufferStream from 'it-buffer-stream'
import { MemoryBlockstore } from 'blockstore-core'
import drain from 'it-drain'

const REPEATS = 10
const FILE_SIZE = Math.pow(2, 20) * 500 // 500MB
const CHUNK_SIZE = 65536

async function main (): Promise<void> {
  const block = new MemoryBlockstore()
  const times: number[] = []

  for (let i = 0; i < REPEATS; i++) {
    const size = FILE_SIZE
    let read = 0
    let lastDate = Date.now()
    let lastPercent = 0

    const options: Partial<ImporterOptions> = {
      onProgress: (evt) => {
        if (evt.type === 'unixfs:importer:progress:file:read') {
          read += Number(evt.detail.bytesRead)

          const percent = Math.round((read / size) * 100)

          if (percent > lastPercent) {
            times[percent] = (times[percent] ?? 0) + (Date.now() - lastDate)

            lastDate = Date.now()
            lastPercent = percent
          }
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
  }

  console.info('Percent\tms') // eslint-disable-line no-console
  times.forEach((time, index) => {
    console.info(`${index}\t${Math.round(time / REPEATS)}`) // eslint-disable-line no-console
  })
}

main().catch(err => {
  console.error(err) // eslint-disable-line no-console
  process.exit(1)
})
