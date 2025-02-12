import type * as AST from './ast.js'
import { Diagnostic } from './diagnostic.js'

export type CompilationResult = {
  success: boolean
  ast?: AST.ProgramNode
  errors: Diagnostic[]
  errorCount: number
}

export type CompilationOptions = {
  outDir: string
  dryRun?: boolean
  languageServer?: boolean
}

