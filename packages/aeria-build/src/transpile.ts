import glob from 'glob'
import * as esbuild from 'esbuild'

export const init = async () => {
  const fileList = glob.sync('src/**/*.ts', {
    dot: true,
  })

  const ctx = await esbuild.context({
    entryPoints: fileList,
    outdir: '.aeria/dist',
    platform: 'node',
  })

  return ctx
}

