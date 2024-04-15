import * as glob from 'glob'
import * as esbuild from 'esbuild'

export const init = async (options: esbuild.BuildOptions = {}) => {
  const fileList = glob.sync('src/**/*.ts', {
    dot: true,
  })

  const ctx = await esbuild.context(Object.assign({
    entryPoints: fileList,
    platform: 'node',
  } satisfies esbuild.BuildOptions, options))

  return ctx
}

