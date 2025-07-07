import type { init } from './init.js'

export const loader = async () => {
  const entrypoint = await import(process.argv[1])
  const entrypointMain: ReturnType<typeof init> = entrypoint.default
    ? entrypoint.default
    : entrypoint

  entrypointMain.listen()
}

