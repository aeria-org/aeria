import type * as AST from './ast.js'
import type { Diagnostic } from './diagnostic.js'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { analyze } from './semantic.js'

export type CompilationResult = {
  success: boolean
  ast: AST.ProgramNode
  errors: Diagnostic[]
  errorCount: number
  emittedFiles: string[]
}

export type CompilationOptions = {
  outDir: string
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

// @ts-expect-error
export const compile = async (fileList: string[], options: CompilationOptions): Promise<CompilationResult> => {
  //
}

