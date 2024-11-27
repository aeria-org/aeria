#!/usr/bin/env -S node --import tsx/esm

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
  const fileList = await Array.fromAsync(fs.promises.glob(`${process.argv[2]}/**/*.mjs`))
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

