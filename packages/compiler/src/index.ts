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
collection File extends aeria.file {}
collection TempFile extends aeria.tempFile {}

functionset Readable {
}

collection Person {
  properties {
    name str
  }
}

collection Business {
  indexes {
    name
  }
  icon "suitcasex"
  properties {
    name str
    picture File @accept(["image/*", "video/*"])
    oi numx
    default_phases []{
      properties {
        name str
        default_phase_steps []{
          properties{
            name str
            default_step_materials []{
              properties {
                name str
                unit str
                person Person @indexes([namex])
              }
            }
          }
        }
      }
    }
  }
  // functions {
  //   include(Readable)
  //   get @expose(["root", "supervisor", "customer"])
  //   getAll @expose(["root", "supervisor", "customer"])
  //   insert @expose(["root", "supervisor"])
  //   upload @expose(["root", "supervisor"])
  //   remove @expose(["root", "supervisor"])
  // }
  // presets {
  //   crud
  // }
}
`

const output = compile(inputCode)
console.log(JSON.stringify(output, null, 2))

