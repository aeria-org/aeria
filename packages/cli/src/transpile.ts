import * as esbuild from 'esbuild'
import { glob } from 'fs/promises'

export const init = async (options: esbuild.BuildOptions = {}) => {
  const fileList = await Array.fromAsync(glob('src/**/*.ts'))

  const ctx = await esbuild.context(Object.assign({
    entryPoints: fileList,
    platform: 'node',
  } satisfies esbuild.BuildOptions, options))

  return ctx
}

