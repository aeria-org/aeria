import { Result } from '@aeriajs/types'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
// import { generateCode } from './codegen.js'
import { analyze } from './semantic.js'

export const compile = async (input: string) => {
  const { error: tokenizeError, result: tokens } = tokenize(input)
  if(tokenizeError){
    console.log(tokenizeError)
    return Result.error(tokenizeError)
  }

  // console.log(JSON.stringify(tokens, null, 2))

  const result = parse(Array.from(tokens))
  console.log(JSON.stringify(result, null, 2))

  // if( error ) {
  //   return Result.error(error)
  // }
  //
  const r = await analyze(result.ast)
  console.log('---')
  console.log(JSON.stringify(r, null, 2))
  console.log('--- end')

  // return generateCode(ast)
}

const inputCode = `
collection Pet {
  properties {
    name str
    details {
      properties {
        age num
      }
    }
  }
}
`

const output = compile(inputCode)
console.log(JSON.stringify(output, null, 2))

