import type * as AST from './ast.js'
import type { Diagnostic } from './diagnostic.js'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { analyze } from './semantic.js'

export type CompilationResult = {
  ast: AST.ProgramNode
  errors: Diagnostic[]
  errorCount: number
  success: boolean
}

export type CompilationOptions = {
  outDir: string
}

export const compile = async (input: string): Promise<CompilationResult> => {
  const { tokens, errors: lexerErrors } = tokenize(input)
  const { ast, errors: parserErrors } = parse(Array.from(tokens))
  const { errors: semanticErrors } = await analyze(ast)

  const errors = lexerErrors.concat(parserErrors, semanticErrors)
  const errorCount = errors.length

  return {
    ast,
    errors,
    errorCount,
    success: !errorCount,
  }
}

export const compileFromFiles = async (fileList: string[], options: CompilationOptions) => {
  //
}

