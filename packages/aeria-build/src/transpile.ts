import glob from 'glob'
import * as esbuild from 'esbuild'
import { WATCH_BUILD_PATH } from './constants.js'

export const init = async () => {
  const fileList = glob.sync('src/**/*.ts', {
    dot: true,
  })

  const ctx = await esbuild.context({
    entryPoints: fileList,
    outdir: WATCH_BUILD_PATH,
    platform: 'node',
  })

  return ctx
}

