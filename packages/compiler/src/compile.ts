import type * as AST from './ast.js'
import { changeCurrentFile, type Diagnostic } from './diagnostic.js'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
import { analyze } from './semantic.js'
import { generateCode } from './codegen.js'
import * as path from 'node:path'
import * as fsPromises from 'node:fs/promises'

export type CompilationResult = {
  success: boolean
  ast: AST.ProgramNode
  errors: Diagnostic[]
  errorCount: number
}

export type CompilationOptions = {
  outDir: string,
  dryRun?: true
}

export const parseAndCheck = async (schemas: Record<string, string>): Promise<CompilationResult> => {

  const errors: CompilationResult['errors'] = []
  let errorCount: CompilationResult['errorCount'] = 0
  let ast: CompilationResult['ast'] | undefined = undefined

  for (const fileName in schemas) {
    changeCurrentFile(fileName)

    const { errors: lexerErrors, tokens } = tokenize(schemas[fileName])
    const { errors: parserErrors, ast: currentAst } = parse(Array.from(tokens))
    const { errors: semanticErrors } = await analyze(currentAst)

    errors.push(...lexerErrors.concat(parserErrors, semanticErrors))
    errorCount += errors.length
    if (!ast) {
      ast = currentAst
    } else {
      Object.assign(ast, currentAst)
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
  const fileList = await fsPromises.readdir(schemaDir)

  const schemas: Record<string, string> = {}
  for (const file of fileList) {
    const fileContent = await fsPromises.readFile(`${schemaDir}/${file}`)
    schemas[file] = fileContent.toString()
  }

  const parsed = await parseAndCheck(schemas)
  const emittedFiles = await generateCode(parsed.ast.collections, options)

  return {
    ...parsed,
    emittedFiles,
  }
}

