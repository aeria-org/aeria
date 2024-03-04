import chokidar from 'chokidar'
import path from 'path'
import { spawn, fork } from 'child_process'
import { systemFunctions } from '@aeriajs/builtins'
import { compile } from './compile.js'
import { log } from './log.js'

export const compileAndSpawn = async () => {
  const result = await compile()

  try {
    const { getConfig } = await import('aeria-sdk/utils')
    const { writeMirrorFiles } = await import('aeria-sdk/mirror')

    const mirror = await systemFunctions.describe({
      router: true,
      noMemoize: true,
    })

    const config = await getConfig()
    writeMirrorFiles(mirror, config)

  } catch( err: any ) {
    if( err.code !== 'MODULE_NOT_FOUND' ) {
      throw err
    }
  }

  if( result.success ) {
    const api = spawn('node', [
      '-r',
      'aeria/loader',
      '--env-file',
      '.env',
      'dist/index.js',
    ])

    api.stdout.on('data', (data) => {
      process.stdout.write(data)
    })
    api.stderr.on('data', (data) => {
      process.stdout.write(data)
    })

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

