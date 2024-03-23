import chokidar from 'chokidar'
import path from 'path'
import { spawn, fork } from 'child_process'
import { compile } from './compile.js'
import { log } from './log.js'
import { mirrorSdk } from './mirrorSdk.js'

const compileOnChanges = () => {
  if( process.env.CHECK_TYPES ) {
    return compile()
  }

  const result = spawn('swc', [
    'src',
    '-d',
    '.aeria/dist',
    '--strip-leading-paths',
    '-C',
    'module.type=es6',
  ])

  result.stdout.pipe(process.stdout)
  result.stderr.pipe(process.stderr)

  return {
    success: !result.exitCode,
  }
}

export const compileAndSpawn = async () => {
  const result = await compileOnChanges()

  if( result.success ) {
    await mirrorSdk()

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

  return null
}

export const watch = async () => {
  let runningApi = fork(path.join(__dirname, 'watchWorker.js'))
  const srcWatcher = chokidar.watch([
    './src',
    './package.json',
    './tsconfig.json',
    './.env',
  ])

  srcWatcher.on('change', async (filePath) => {
    runningApi.kill()

    if( runningApi.exitCode === null ) {
      await new Promise<void>((resolve) => {
        runningApi.on('exit', () => {
          resolve()
        })
      })
    }

    log('info', `change detected in file: ${filePath}`)
    log('info', 'compiling...')

    runningApi = fork(path.join(__dirname, 'watchWorker.js'))
  })
}

