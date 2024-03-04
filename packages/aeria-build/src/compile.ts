import ts from 'typescript'
import glob from 'glob'
import path from 'path'
import { readFile } from 'fs/promises'
import { left, right, deepMerge } from '@aeriajs/common'
import { log } from './log.js'

export const compile = async () => {
  const fileList = glob.sync('**/*.ts', {
    ignore: ['node_modules/**/*.ts'],
  })

  const tsConfig = JSON.parse(await readFile(`${process.cwd()}/tsconfig.json`, {
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
        tsConfig,
        JSON.parse(await readFile(resolvedPath, {
          encoding: 'utf-8',
        })),
      ),
    )
  }

  const compilerOptions = tsConfig.compilerOptions as unknown

  const selectedFiles = fileList.filter((file) => {
    const testFile = (exp: string) => new RegExp(exp.replace('*', '([^\/]+)'), 'g').test(file)
    if( tsConfig.include ) {
      return tsConfig.include.some(testFile)
    }

    if( tsConfig.exclude ) {
      return !tsConfig.exclude.some(testFile)
    }

    return true
  })

  const program = ts.createProgram(selectedFiles, compilerOptions as ts.CompilerOptions)
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

export const compilationPhase = async () => {
  const result = await compile()

  if( !result.success ) {
    return left(`typescript compilation produced ${result.diagnostics.length} errors, please fix them`)
  }

  return right('compilation succeeded')
}

