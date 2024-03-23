import type { BuildContext } from 'esbuild'
import chokidar from 'chokidar'
import path from 'path'
import { spawn, fork, type ChildProcessWithoutNullStreams } from 'child_process'
import { compile } from './compile.js'
import { log } from './log.js'
import { mirrorSdk } from './mirrorSdk.js'
import * as transpile from './transpile.js'

const processEnv = Object.assign({
  AERIA_MAIN: '.aeria/dist/index.js',
}, process.env)

const compileOnChanges = async (transpileCtx: BuildContext) => {
  if( process.env.CHECK_TYPES ) {
    return compile()
  }

  try {
    await transpileCtx.rebuild()
    return {
      success: true,
    }
  } catch( err: any ) {
    console.log(err.message)
  }

  return {
    success: false,
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
  ], {
    env: processEnv,
  })

  api.stdout.pipe(process.stdout)
  api.stderr.pipe(process.stderr)

  return api
}

export const watch = async () => {
  const transpileCtx = await transpile.init()
  const initialCompilationResult = await compileOnChanges(transpileCtx)

  let runningApi: ChildProcessWithoutNullStreams | undefined
  process.env.AERIA_MAIN = '.aeria/dist/index.js'

  process.on('SIGINT', () => {
    transpileCtx.dispose()
    if( runningApi ) {
      runningApi.kill()
    }

    process.exit(0)
  })

  if( initialCompilationResult.success ) {
    runningApi = await spawnApi()
    await mirrorSdk()
  }

  const srcWatcher = chokidar.watch([
    './src',
    './package.json',
    './tsconfig.json',
    './.env',
  ])

  srcWatcher.on('change', async (filePath) => {
    if( runningApi ) {
      runningApi.kill()

      if( runningApi.connected ) {
        await new Promise<void>((resolve) => {
          runningApi!.on('exit', () => {
            resolve()
          })
        })
      }
    }

    console.clear()
    log('info', `change detected in file: ${filePath}`)
    log('info', 'compiling...')

    const compilationResult = await compileOnChanges(transpileCtx)
    if( compilationResult.success ) {
      runningApi = await spawnApi()

      fork(path.join(__dirname, 'watchWorker.js'), {
        env: processEnv,
        detached: true,
      })
    }
  })
}

