import * as ts from 'typescript'
import * as path from 'path'
import * as glob from 'glob'
import * as JSON5 from 'json5'
import * as transpile from './transpile.js'
import { readFile } from 'fs/promises'
import { left, right, deepMerge } from '@aeriajs/common'
import { log } from './log.js'

type TsConfig = {
  extends?: string
  include?: string[]
  exclude?: string[]
  compilerOptions: ts.CompilerOptions
}

export type CompileOptions = {
  useTsc?: boolean
}

let tsConfigMemo: TsConfig | undefined

export const getUserTsconfig = async () => {
  if( tsConfigMemo ) {
    return tsConfigMemo
  }

  const tsConfig: TsConfig = JSON5.parse(await readFile(`${process.cwd()}/tsconfig.json`, {
    encoding: 'utf-8',
  }))

  if( tsConfig.extends ) {
    const extendsPath = tsConfig.extends
    const resolvedPath = /^\.{1,2}\//.test(extendsPath)
      ? path.join(process.cwd(), extendsPath)
      : require.resolve(extendsPath)

    Object.assign(
      tsConfig,
      deepMerge(
        JSON5.parse(await readFile(resolvedPath, {
          encoding: 'utf-8',
        })),
        tsConfig,
      ),
    )
  }

  const compilerOptions = tsConfig.compilerOptions
  compilerOptions.outDir ??= 'dist'

  if( compilerOptions.target ) {
    compilerOptions.target = findCaseInsensitiveKey(ts.ScriptTarget, compilerOptions.target)
  }
  if( compilerOptions.module ) {
    compilerOptions.module = findCaseInsensitiveKey(ts.ModuleKind, compilerOptions.module)
  }
  if( compilerOptions.moduleResolution ) {
    compilerOptions.moduleResolution = findCaseInsensitiveKey(ts.ModuleResolutionKind, compilerOptions.moduleResolution)
  }

  tsConfigMemo = tsConfig
  return tsConfig
}

const findCaseInsensitiveKey = <TObject extends Record<string, any>>(object: TObject, search: any): TObject[keyof TObject] => {
  if( typeof search !== 'string' ) {
    return object[search]
  }

  const found = Object.entries(object)
    .find(([key]) => key.toLowerCase() === search.toLowerCase())

  return found
    ? found[1]
    : null
}

export const getTsconfig = async (additionalOptions?: ts.CompilerOptions) => {
  const tsConfig = await getUserTsconfig()

  if( additionalOptions ) {
    Object.assign(tsConfig.compilerOptions, additionalOptions)
  }

  return tsConfig
}

export const compile = async (additionalOptions?: ts.CompilerOptions) => {
  const fileList = glob.sync('**/*.ts', {
    ignore: ['node_modules/**/*.ts'],
    dot: true,
  })

  const tsConfig = await getTsconfig(additionalOptions)

  const selectedFiles = fileList.filter((file) => {
    const testFile = (exp: string) => new RegExp(exp.replace('*', '([^\/]+)')).test(file.replace(/\\/g, '/'))

    if( tsConfig.include ) {
      return tsConfig.include.some(testFile)
    }

    if( tsConfig.exclude ) {
      return !tsConfig.exclude.some(testFile)
    }

    return true
  })

  const program = ts.createProgram(selectedFiles, tsConfig.compilerOptions)
  const emitResult = program.emit()

  const diagnostics = ts.getPreEmitDiagnostics(program)

  if( diagnostics.length ) {
    diagnostics.forEach((diagnostic) => {
      if( diagnostic.file && diagnostic.start ) {
        const { line, character } = ts.getLineAndCharacterOfPosition(
          diagnostic.file,
          diagnostic.start,
        )

        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        log('error', `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`)
        return
      }

      log('error', ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    })

    log('error', `${diagnostics.length} errors found`)
  }

  if( emitResult.emitSkipped ) {
    return <const>{
      success: false,
      diagnostics: diagnostics,
    }
  }

  return <const>{
    success: true,
    program,
  }
}

export const compilationPhase = async (options: CompileOptions = {}) => {
  const tsConfig = await getUserTsconfig()
  const result = await compile({
    emitDeclarationOnly: !options.useTsc,
  })

  if( !result.success ) {
    return left(`typescript compilation produced ${result.diagnostics.length} errors, please fix them`)
  }

  if( !options.useTsc ) {
    const transpileCtx = await transpile.init({
      outdir: tsConfig.compilerOptions.outDir,
      format: tsConfig.compilerOptions.module === ts.ModuleKind.CommonJS
        ? 'cjs'
        : 'esm',
    })

    await transpileCtx.rebuild()
    await transpileCtx.dispose()
  }

  return right('compilation succeeded')
}

