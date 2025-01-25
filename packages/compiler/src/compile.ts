import path from 'path'
import type * as AST from './ast.js'
import type { Diagnostic } from './diagnostic.js'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { analyze } from './semantic.js'
import fs from 'fs'
import { generateCode } from './codegen.js'

export type CompilationResult = {
  success: boolean
  ast: AST.ProgramNode
  errors: Diagnostic[]
  errorCount: number
  emittedFiles: string[]
}

export type CompilationOptions = {
  outDir: string,
  dryRun?: true
}

export const parseAndCheck = async (input: string): Promise<CompilationResult> => {
  const { errors: lexerErrors, tokens } = tokenize(input)
  const { errors: parserErrors, ast } = parse(Array.from(tokens))
  const { errors: semanticErrors } = await analyze(ast)

  const errors = lexerErrors.concat(parserErrors, semanticErrors)
  const errorCount = errors.length

  return {
    success: !errorCount,
    ast,
    errors,
    errorCount,
    emittedFiles: [],
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
  const fileList = await fs.promises.readdir(schemaDir)

  let schemaCode = ''
  for (const file of fileList) {
    const fileCode = await fs.promises.readFile(`${schemaDir}/${file}`)
    schemaCode += fileCode + '\n\n'
  }

  const parsed = await parseAndCheck(schemaCode)
  const compiledCode = generateCode(parsed.ast.collections, options)

  return compiledCode
}

