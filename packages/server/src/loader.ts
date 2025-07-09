import type { init } from './init.js'
import { dynamicImport } from '@aeriajs/common'

export const loader = async () => {
  const path = process.argv[1]
  const entrypoint = await dynamicImport(path)
  const entrypointMain: ReturnType<typeof init> = entrypoint.default

  entrypointMain.listen()
}

