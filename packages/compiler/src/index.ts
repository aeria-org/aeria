import { tokenize } from './lexer'
import { parse } from './parser'
import { generateCode } from './codegen'

export const compile = (input: string) => {
  const tokens = tokenize(input)

  const ast = parse(Array.from(tokens))
  return generateCode(ast)
}

const inputCode = `functionset Readable {
  get
  getAll @expose
}

functionset Writable {
  insert
  remove
  removeAll
}
foudass da silva
collection File extends aeria.file {}
collection TempFile extends aeria.tempFile {}
collection User extends aeria.user {}

collection Animal {
  owned true
  properties {
    name str
    specie enum @values(["dog", "cat"])
    details {
      properties {
        age num @minimum(10)
      }
    }
  }
  functions {
    @include(Readable)
    @include(Writable)
    custom @expose
  }
}

collection Pet {
}

contract GetPerson {
  payload {
    properties {
      name str
      pet Pet
    }
  }
  response
    | Error { properties { name str } }
    | Result { properties { name str, age num } }
    | str
}
`

const output = compile(inputCode)
console.log(JSON.stringify(output, null, 2))

