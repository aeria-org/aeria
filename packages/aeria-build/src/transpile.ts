import glob from 'glob'
import * as esbuild from 'esbuild'

export const init = async () => {
  const fileList = glob.sync('**/*.ts', {
    ignore: ['node_modules/**/*.ts'],
    dot: true,
  })

  const ctx = await esbuild.context({
    entryPoints: fileList,
    bundle: true,
    outdir: 'build-test',
    platform: 'node',
    external: ['*'],
  })

  return ctx
}

