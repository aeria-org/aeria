import path from 'path'
import type * as AST from './ast.js'
import type { Diagnostic } from './diagnostic.js'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { analyze } from './semantic.js'
import fs from 'fs'
import { generateCode } from './codegen.js'

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
  let code = ''
  const fileList = await fs.promises.readdir(schemaDir)
  for (const file of fileList) {
    const fileCode = await fs.promises.readFile(`${schemaDir}/${file}`)
    code += fileCode + '\n\n'
  }
  
  const compilation = await compile(code)
  const compiledCode = generateCode(compilation.ast.collections, options.outDir)

  return compiledCode
}

