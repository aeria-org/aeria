import type { init } from './init.js'
import { dynamicImport } from '@aeriajs/common'

export const loader = async () => {
  const entrypoint = await dynamicImport(process.argv[1])
  const entrypointMain: ReturnType<typeof init> = entrypoint.default
    ? entrypoint.default
    : entrypoint

  entrypointMain.listen()
}

