import type * as AST from './ast.js'
import { Diagnostic } from './diagnostic.js'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { analyze } from './semantic.js'
import { generateCode } from './codegen.js'
import * as path from 'node:path'
import * as fsPromises from 'node:fs/promises'
import { existsSync } from 'node:fs'

export type CompilationResult = {
  success: boolean
  ast?: AST.ProgramNode
  errors: Diagnostic[]
  errorCount: number
}

export type CompilationOptions = {
  outDir: string,
  dryRun?: true
}

export const parseAndCheck = async (sources: Record<string, string>): Promise<CompilationResult> => {
  const errors: CompilationResult['errors'] = []
  let errorCount: CompilationResult['errorCount'] = 0
  let ast: CompilationResult['ast'] | undefined

  for (const fileName in sources) {
    Diagnostic.currentFile = fileName

    const { errors: lexerErrors, tokens } = tokenize(sources[fileName])
    const { errors: parserErrors, ast: currentAst } = parse(Array.from(tokens))
    const { errors: semanticErrors } = await analyze(currentAst)

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
    ast: ast!,
  }
}

export const generateScaffolding = async (options: CompilationOptions) => {
  const directories = [path.join(options.outDir, 'collections')]

  for( const dir of directories ) {
    await fsPromises.mkdir(dir, {
      recursive: true,
    })
  }

  return directories
}

export const compileFromFiles = async (schemaDir: string, options: CompilationOptions) => {
  if (!existsSync(schemaDir)) {
    return {
      success: false,
      emittedFiles: null,
    }
  }

  const fileList = await fsPromises.readdir(schemaDir)

  const sources: Record<string, string> = {}
  for (const file of fileList) {
    sources[file] = await fsPromises.readFile(`${schemaDir}/${file}`, {
      encoding: 'utf-8',
    })
  }

  const parsed = await parseAndCheck(sources)
  const emittedFiles = parsed.ast ?
    await generateCode(parsed.ast, options) :
    {}

  return {
    ...parsed,
    emittedFiles,
  }
}

