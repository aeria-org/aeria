import chokidar from 'chokidar'
import path from 'path'
import { spawn, fork } from 'child_process'
import { log } from './log.js'
import { mirrorSdk } from './mirrorSdk.js'

export const compileAndSpawn = async () => {
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

  await new Promise<void>((resolve) => {
    result.on('close', () => resolve())
  })

  if( !result.exitCode ) {
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

