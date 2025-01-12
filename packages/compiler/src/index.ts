import { Result } from '@aeriajs/types'
import { tokenize } from './lexer.js'
import { parse } from './parser.js'
// import { generateCode } from './codegen.js'
// import { analyze } from './semantic.js'

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
  // const r = await analyze(result.ast)
  // console.log('---')
  // console.log(r)
  // console.log('--- end')

  // return generateCode(ast)
}

const inputCode = `
functionset Readable {
  get
  getAll @expose
}

functionset Writable {
  insert
  remove
  removeAll
}

collection File extends aeria.file {}
collection TempFile extends aeria.tempFile {}
collection User extends aeria.user {}

collection Animal {
  // owned true
  // properties {
  //   name str
  //   specie enum @values(["dog", "cat"])
  //   user User @indexes([])
  //   details {
  //     properties {
  //       age num @minimum(10)
  //       dates []date
  //     }
  //   }
  // }
  // functions {
  //   @include(Readable)
  //   @include(Writable)
  //   custom @expose
  // }
  actions {
    add {
      label "add"
      route "test"
      clearItem true
      button true
    }
  }
}

// collection Pet {
//   properties {
//     name str
//   }
// }
//
// contract Test {
//   payload {
//     properties {
//       user_id str
//     }
//   }
//   response
//     | Result User @indexes([xa])
//     | Result {
//       properties {
//         name str
//       }
//     }
// }

// contract GetPerson {
//   payload {
//     properties {
//       name str
//       pet Pet
//     }
//   }
//   response
//     | Error { properties { name str } }
//     | Result { properties { name str, age num } }
//     | str
// }
`

const output = compile(inputCode)
console.log(JSON.stringify(output, null, 2))

