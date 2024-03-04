#!/usr/bin/env -S pnpm ts-node --swc

import glob from 'glob'
import { Transform } from 'stream'
import * as fs from 'fs'

const renameExtensions = () => new Transform({
  transform(chunk, _encoding, callback) {
    const transformedChunk = String(chunk)
      .replace(/\.js(['"])/g, (_, m1) => `.mjs${m1}`)

    callback(null, transformedChunk)
  },
})

const main = async () => {
  const fileList = glob.sync(`${process.argv[2]}/**/*.mjs`)
  for( const file of fileList ) {
    const tempPath = `${file}.tmp`

    await new Promise<void>((resolve) => {
      const writerStream = fs.createWriteStream(tempPath, {
        flags: 'w',
      })

      fs.createReadStream(file)
        .pipe(renameExtensions())
        .pipe(writerStream)
        .on('close', resolve)
    })

    await fs.promises.rename(tempPath, file)
  }

}

main()

