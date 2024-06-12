import type { BuildContext } from 'esbuild'
import ts from 'typescript'
import * as chokidar from 'chokidar'
import { fileURLToPath } from 'url'
import { spawn, fork, type ChildProcessWithoutNullStreams } from 'child_process'
import { log } from './log.js'
import { mirrorSdk } from './mirrorSdk.js'
import { buildAeriaLangPhase } from './buildAeriaLang.js'
import { getUserTsconfig, compile, type CompileOptions } from './compile.js'
import * as transpile from './transpile.js'

const processEnv = async () => {
  const tsConfig = await getUserTsconfig()
  const outDir = tsConfig.compilerOptions.outDir

  return Object.assign({
    AERIA_MAIN: `${outDir}/index.js`,
  }, process.env)
}

const compileOnChanges = async (transpileCtx: BuildContext | null) => {
  const { error, result } = await buildAeriaLangPhase()
  if( error ) {
    log('error', error)

    return {
      success: false,
    }
  }

  log('info', result!)

  if( transpileCtx ) {
    try {
      await transpileCtx.rebuild()
      return {
        success: true,
      }
    } catch( err: any ) {
      console.trace(err.message)
    }

    return {
      success: false,
    }
  }

  return compile()
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

export const watch = async (options: CompileOptions = {}) => {
  const tsConfig = await getUserTsconfig()
  const transpileCtx = !options.useTsc
    ? await transpile.init({
      outdir: tsConfig.compilerOptions.outDir,
      format: tsConfig.compilerOptions.module === ts.ModuleKind.CommonJS
        ? 'cjs'
        : 'esm',
    })
    : null

  const initialCompilationResult = await compileOnChanges(transpileCtx)

  let runningApi: ChildProcessWithoutNullStreams | undefined
  process.env.AERIA_MAIN = `${tsConfig.compilerOptions.outDir}/index.js`

  const compilationWorker = !options.useTsc
    ? fork(fileURLToPath(import.meta.resolve('./compilationWorker.js')))
    : null

  if( compilationWorker ) {
    compilationWorker.send({})
  }

  process.on('SIGINT', () => {
    if( transpileCtx ) {
      transpileCtx.dispose()
    }
    if( runningApi ) {
      runningApi.kill()
    }
    if( compilationWorker ) {
      compilationWorker.kill()
    }

    process.exit(0)
  })

  if( initialCompilationResult.success ) {
    runningApi = await spawnApi()

    const { result } = await mirrorSdk({
      environment: 'development',
    })

    log('info', result)
  }

  const srcWatcher = chokidar.watch([
    'src',
    'schemas',
    'package.json',
    'tsconfig.json',
    '.env',
  ])

  srcWatcher.on('change', async (filePath) => {
    if( runningApi ) {
      runningApi.kill()

      if( !runningApi.killed && runningApi.exitCode === null ) {
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

      if( compilationWorker ) {
        compilationWorker.send({})
      }

      fork(fileURLToPath(import.meta.resolve('./watchWorker.js')), {
        env: await processEnv(),
        detached: true,
      })
    }
  })
}

