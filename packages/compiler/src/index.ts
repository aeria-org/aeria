import { tokenize } from './lexer.js'
import { parse } from './parser.js'
// import { generateCode } from './codegen.js'
import { analyze } from './semantic.js'

export const compile = async (input: string) => {
  const { tokens, errors: lexerErrors } = tokenize(input)
  const { ast, errors: parserErrors } = parse(Array.from(tokens))
  const { errors: semanticErrors } = await analyze(ast)

  const errors = lexerErrors.concat(parserErrors, semanticErrors)
  const errorCount = errors.length

  const result = {
    ast,
    errors,
    errorCount,
    success: !errorCount,
  }

  console.log(JSON.stringify(result, null, 2))
}

const inputCode = `
collection Pet {
  properties {
    name str
  }
}
`

const output = compile(inputCode)
console.log(JSON.stringify(output, null, 2))

