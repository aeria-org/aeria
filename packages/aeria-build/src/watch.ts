import type { BuildContext } from 'esbuild'
import chokidar from 'chokidar'
import path from 'path'
import { spawn, fork } from 'child_process'
import { compile } from './compile.js'
import { log } from './log.js'
import * as transpile from './transpile.js'

const compileOnChanges = async (transpileCtx: BuildContext) => {
  if( process.env.CHECK_TYPES ) {
    return compile()
  }

  const result = await transpileCtx.rebuild()

  return {
    success: !result.errors.length,
  }
}

export const spawnApi = async () => {
  const api = spawn('node', [
    '-r',
    'aeria/loader',
    '--preserve-symlinks',
    '--env-file',
    '.env',
    '.aeria/dist/index.js',
  ])

  api.stdout.pipe(process.stdout)
  api.stderr.pipe(process.stderr)

  return api
}

export const watch = async () => {
  let runningApi = await spawnApi()
  const srcWatcher = chokidar.watch([
    './src',
    './package.json',
    './tsconfig.json',
    './.env',
  ])

  const transpileCtx = await transpile.init()

  srcWatcher.on('change', async (filePath) => {
    runningApi.kill()

    if( runningApi.exitCode === null ) {
      await new Promise<void>((resolve) => {
        runningApi.on('exit', () => {
          resolve()
        })
      })
    }

    console.clear()
    log('info', `change detected in file: ${filePath}`)
    log('info', 'compiling...')

    const compilationResult = await compileOnChanges(transpileCtx)
    if( compilationResult.success ) {
      runningApi = await spawnApi()
      fork(path.join(__dirname, 'watchWorker.js'))
    }
  })
}

