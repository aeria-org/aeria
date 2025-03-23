import type { CompilationOptions, CompilationResult } from './types.js'
import type { Token } from './token.js'
import { Diagnostic } from './diagnostic.js'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { analyze } from './semantic.js'
import { generateCode } from './codegen.js'
import * as path from 'node:path'
import * as fs from 'node:fs'

export const parseAndCheck = async (sources: Record<string, string>, options: Pick<CompilationOptions, 'languageServer'> = {}): Promise<CompilationResult> => {
  const errors: CompilationResult['errors'] = []

  const allTokens: Token[] = []
  for (const fileName in sources) {
    Diagnostic.currentFile = fileName
    const { errors: lexerErrors, tokens } = tokenize(sources[fileName])

    if (lexerErrors.length > 0) {
      errors.push(...lexerErrors)
    }

    allTokens.push(...tokens)
  }

  const { errors: parserErrors, ast } = parse(allTokens)
  const { errors: semanticErrors } = await analyze(ast, options)

  errors.push(...parserErrors.concat(semanticErrors))
  return {
    success: errors.length === 0,
    errors,
    errorCount: errors.length,
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

export const compileFromFiles = async (globPattern: string, options: CompilationOptions) => {
  const fileList = await Array.fromAsync(fs.promises.glob(globPattern))

  const sources: Record<string, string> = {}
  for (const fileName of fileList) {
    sources[fileName] = await fs.promises.readFile(fileName, {
      encoding: 'utf-8',
    })
  }

  const result = await parseAndCheck(sources, options)
  if( !result.ast || result.errorCount > 0 ) {
    return result
  }

  const emittedFiles = await generateCode(result.ast, options)
  return {
    ...result,
    emittedFiles,
  }
}

