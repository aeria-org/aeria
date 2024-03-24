import * as glob from 'glob'
import * as esbuild from 'esbuild'
import { WATCH_BUILD_PATH } from './constants.js'

export const init = async (options: esbuild.BuildOptions = {}) => {
  const fileList = glob.sync('src/**/*.ts', {
    dot: true,
  })

  const ctx = await esbuild.context(Object.assign({
    entryPoints: fileList,
    outdir: WATCH_BUILD_PATH,
    platform: 'node',
  }, options))

  return ctx
}

