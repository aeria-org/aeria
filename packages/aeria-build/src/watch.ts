import type { BuildContext } from 'esbuild'
import chokidar from 'chokidar'
import path from 'path'
import { spawn, fork, type ChildProcessWithoutNullStreams } from 'child_process'
import { log } from './log.js'
import { mirrorSdk } from './mirrorSdk.js'
import { getUserTsconfig } from './compile.js'
import * as transpile from './transpile.js'

const processEnv = async () => {
  const tsConfig = await getUserTsconfig()
  const outDir = tsConfig.compilerOptions.outDir

  return Object.assign({
    AERIA_MAIN: `${outDir}/index.js`,
  }, process.env)
}

export type WatchOptions = {
  commonjs?: boolean
}

const compileOnChanges = async (transpileCtx: BuildContext) => {
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
  const tsConfig = await getUserTsconfig()

  const api = spawn('node', [
    '-r',
    'aeria/loader',
    '--preserve-symlinks',
    '--env-file=.env',
    '--experimental-specifier-resolution=node',
    `${tsConfig.compilerOptions.outDir}/index.js`,
  ], {
    env: await processEnv(),
  })

  api.stdout.pipe(process.stdout)
  api.stderr.pipe(process.stderr)

  return api
}

export const watch = async (options: WatchOptions = {}) => {
  const tsConfig = await getUserTsconfig()
  const transpileCtx = await transpile.init({
    outdir: tsConfig.compilerOptions.outDir,
    format: options.commonjs
      ? 'cjs'
      : 'esm',
  })

  const initialCompilationResult = await compileOnChanges(transpileCtx)

  let runningApi: ChildProcessWithoutNullStreams | undefined
  process.env.AERIA_MAIN = `${tsConfig.compilerOptions.outDir}/index.js`

  process.on('SIGINT', () => {
    transpileCtx.dispose()
    if( runningApi ) {
      runningApi.kill()
    }

    process.exit(0)
  })

  const compilerWorker = fork(path.join(__dirname, 'compilationWorker.js'))
  compilerWorker.send(options)

  if( initialCompilationResult.success ) {
    runningApi = await spawnApi()
    await mirrorSdk()
  }

  const srcWatcher = chokidar.watch([
    'src',
    'package.json',
    'tsconfig.json',
    '.env',
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

      compilerWorker.send(options)

      fork(path.join(__dirname, 'watchWorker.js'), {
        env: await processEnv(),
        detached: true,
      })
    }
  })
}

