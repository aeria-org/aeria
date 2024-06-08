import * as esbuild from 'esbuild'
import { glob } from 'glob'

export const init = async (options: esbuild.BuildOptions = {}) => {
  const fileList = await glob('src/**/*.ts', {
    dot: true,
  })

  const ctx = await esbuild.context(Object.assign({
    entryPoints: fileList,
    platform: 'node',
  } satisfies esbuild.BuildOptions, options))

  return ctx
}

