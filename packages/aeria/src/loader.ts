import type { init } from '@aeriajs/server'
import { dynamicImport } from '@aeriajs/common'

const main = async () => {
  const entrypoint = await dynamicImport(process.argv[1])
  const entrypointMain: ReturnType<typeof init> = entrypoint.default
    ? entrypoint.default
    : entrypoint

  entrypointMain.listen()
}

main()

