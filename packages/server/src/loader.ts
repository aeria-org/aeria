import type { init } from './init.js'
import { pathToFileURL } from 'node:url'

export const loader = async () => {
  const path = process.argv[1]
  const entrypoint = await import(pathToFileURL(path.replace(/\\/g, '\\\\')).href)
  const entrypointMain: ReturnType<typeof init> = entrypoint.default

  entrypointMain.listen()
}

