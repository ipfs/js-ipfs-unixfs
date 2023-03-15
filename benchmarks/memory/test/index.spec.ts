/* eslint-disable no-console */

import { importer } from 'ipfs-unixfs-importer'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import drain from 'it-drain'
import { FsBlockstore } from 'blockstore-fs'

const ONE_MEG = 1024 * 1024

const FILE_SIZE = ONE_MEG * 1000
const CHUNK_SIZE = ONE_MEG

async function main (): Promise<void> {
  const dir = path.join(os.tmpdir(), `test-${Date.now()}`)
  const blocks = new FsBlockstore(dir)
  await blocks.open()

  console.info('bytes imported (mb), heap total (mb), heap used (mb), rss (mb)')

  try {
    await drain(importer([{
      content: (async function * (): AsyncIterable<Uint8Array> {
        for (let i = 0; i < FILE_SIZE; i += CHUNK_SIZE) {
          yield new Uint8Array(CHUNK_SIZE)

          // @ts-expect-error only present when node is run with --expose-gc
          global.gc()

          console.info(`${i / ONE_MEG}, ${process.memoryUsage().heapTotal / ONE_MEG}, ${process.memoryUsage().heapUsed / ONE_MEG}, ${process.memoryUsage().rss / ONE_MEG}`)
        }
      })()
    }], blocks))
  } catch (err) {
    console.error(err)
  } finally {
    await blocks.close()
    fs.rmSync(dir, {
      recursive: true
    })
  }
}

main().catch(err => {
  console.error(err) // eslint-disable-line no-console
  process.exit(1)
})
