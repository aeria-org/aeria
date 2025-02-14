import type { CompilationOptions, CompilationResult } from './types.js'
import { Diagnostic } from './diagnostic.js'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { analyze } from './semantic.js'
import { generateCode } from './codegen.js'
import * as path from 'node:path'
import * as fs from 'node:fs'

export const FILE_PRECEDENCE = ['contract']

export const parseAndCheck = async (sources: Record<string, string>, options: Pick<CompilationOptions, 'languageServer'> = {}): Promise<CompilationResult> => {
  const errors: CompilationResult['errors'] = []
  let errorCount: CompilationResult['errorCount'] = 0
  let ast: CompilationResult['ast'] | undefined

  for (const fileName in sources) {
    Diagnostic.currentFile = fileName

    const { errors: lexerErrors, tokens } = tokenize(sources[fileName])
    const { errors: parserErrors, ast: currentAst } = parse(Array.from(tokens))
    const { errors: semanticErrors } = await analyze(currentAst, options)

    errors.push(...lexerErrors.concat(parserErrors, semanticErrors))
    errorCount += errors.length
    if (!ast) {
      ast = currentAst
    } else {
      ast.collections.push(...currentAst.collections)
      ast.contracts.push(...currentAst.contracts)
      ast.functionsets.push(...currentAst.functionsets)
    }
  }

  return {
    success: errorCount === 0,
    errors,
    errorCount,
    ast,
  }
}

export const generateScaffolding = async (options: CompilationOptions) => {
  const directories = [path.join(options.outDir, 'collections')]

  for( const dir of directories ) {
    await fs.promises.mkdir(dir, {
      recursive: true,
    })
  }

  return directories
}

export const compileFromFiles = async (schemaDir: string, options: CompilationOptions) => {
  const fileList = await Array.fromAsync(fs.promises.glob(`${schemaDir}/*.aeria`))
  const sortedFileList = fileList.sort((a, b) => {
    const aIndex = FILE_PRECEDENCE.findIndex((file) => a.split('/').at(-1)!.startsWith(file))
    const bIndex = FILE_PRECEDENCE.findIndex((file) => b.split('/').at(-1)!.startsWith(file))

    if( !~aIndex && !~bIndex ) {
      return 1
    }

    return aIndex > bIndex
      ? 1
      : -1
  })

  const sources: Record<string, string> = {}
  for (const file of sortedFileList) {
    sources[file] = await fs.promises.readFile(file, {
      encoding: 'utf-8',
    })
  }

  const result = await parseAndCheck(sources, options)
  if( !result.ast ) {
    return result
  }

  const emittedFiles = await generateCode(result.ast, options)
  return {
    ...result,
    emittedFiles,
  }
}

