import type { Property, ContractWithRoles, AccessCondition } from '@aeriajs/types'
import { tokenize, TokenType, type Token } from './lexer'
import { generateCode } from './codegen'
import { getNode } from './ast'

const PropertyType = {
  str: 'string',
  int: 'integer',
  num: 'number',
  bool: 'boolean',
} as const

type ASTCollectionNode = {
  type: 'collection'
  name: string
  properties: Record<string, Property>
  functions?: Record<string, AccessCondition>
}

type ASTContractNode = ContractWithRoles & {
  type: 'contract'
  name: string
}

type ASTFunctionSetNode = {
  type: 'functionset'
  name: string
  functions: Record<string, AccessCondition>
}

export type ASTNode =
  | ASTCollectionNode
  | ASTContractNode
  | ASTFunctionSetNode

export type ASTNodeType = ASTNode['type']

export const parse = (tokens: Token[]) => {
  let current = 0

  const match = ({ expected, value }: { expected: TokenType,
    value?: string }) => {
    const token = tokens[current]
    if( token.type === expected ) {
      if( value !== undefined ) {
        return token.value === value
      }
      return true
    }

    return false
  }

  const consume = ({ expected, value }: { expected: TokenType,
    value?: string }) => {
    const token = tokens[current]
    if( match({
      expected,
      value,
    }) ) {
      current++
      return token
    }

    throw new Error(`expected "${expected}" but found "${token.type}" instead`)
  }

  const consumePropertyType = (): Property => {
    let property: Property

    if( match({
      expected: TokenType.LeftBracket,
    }) ) {
      consume({
        expected: TokenType.LeftBracket,
      })

      property = {
        type: 'object',
        properties: {},
      }

      while( !match({
        expected: TokenType.RightBracket,
      }) ) {
        const { value: keyword } = tokens[current]
        switch( keyword ) {
          case 'properties': {
            consume({
              expected: TokenType.Identifier,
              value: 'properties',
            })
            property.properties = consumePropertiesBlock()
            break
          }
          default:
            throw new Error(`invalid keyword "${keyword}"`)
        }
      }

      consume({
        expected: TokenType.RightBracket,
      })

    } else {
      const { value: propType } = consume({
        expected: TokenType.Identifier,
      })
      switch( propType ) {
        case 'str':
        case 'bool':
        case 'num':
        case 'int': {
          property = {
            type: PropertyType[propType],
          }
          break
        }
        default:
          throw new Error(propType)
      }
    }

    while( match({
      expected: TokenType.AttributeName,
    }) ) {
      const { value: attributeName } = consume({
        expected: TokenType.AttributeName,
      })
      let insideParens = false
      if( match({
        expected: TokenType.LeftParens,
      }) ) {
        consume({
          expected: TokenType.LeftParens,
        })
        insideParens = true
      }

      const attributeValue = tokens[current++].value

      if( insideParens ) {
        consume({
          expected: TokenType.RightParens,
        })
      }

      Object.assign(property, {
        [attributeName]: attributeValue,
      })
    }

    return property
  }

  const consumePropertiesBlock = () => {
    consume({
      expected: TokenType.LeftBracket,
    })

    const properties: Record<string, Property> = {}
    while( !match({
      expected: TokenType.RightBracket,
    }) ) {
      const { value: propName } = consume({
        expected: TokenType.Identifier,
      })
      properties[propName] = consumePropertyType()
    }

    consume({
      expected: TokenType.RightBracket,
    })
    return properties
  }

  const consumeMultiplePropertyTypes = () => {
    if( match({
      expected: TokenType.Pipe,
    }) ) {
      consume({
        expected: TokenType.Pipe,
      })

      const properties = []
      while( current < tokens.length ) {
        properties.push(consumePropertyType())

        if( match({
          expected: TokenType.Pipe,
        }) ) {
          consume({
            expected: TokenType.Pipe,
          })
        } else {
          break
        }
      }

      return properties
    }

    return consumePropertyType()
  }

  const consumeCollection = (ast: ASTNode[]): ASTCollectionNode => {
    consume({
      expected: TokenType.Identifier,
      value: 'collection',
    })
    const { value: name } = consume({
      expected: TokenType.Identifier,
    })
    consume({
      expected: TokenType.LeftBracket,
    })

    const node: ASTCollectionNode = {
      type: 'collection',
      name,
      properties: {},
    }

    while( !match({
      expected: TokenType.RightBracket,
    }) ) {
      const { value: propType } = tokens[current]
      switch( propType ) {
        case 'properties': {
          consume({
            expected: TokenType.Identifier,
            value: 'properties',
          })
          node.properties = consumePropertiesBlock()
          break
        }
        case 'functions': {
          consume({
            expected: TokenType.Identifier,
            value: 'functions',
          })
          node.functions = consumeFunctionsBlock(ast)
          break
        }
        default:
          throw new Error(`invalid token "${propType}"`)
      }
    }

    consume({
      expected: TokenType.RightBracket,
    })
    return node
  }

  const consumeContract = (): ASTContractNode => {
    consume({
      expected: TokenType.Identifier,
      value: 'contract',
    })
    const { value: name } = consume({
      expected: TokenType.Identifier,
    })
    consume({
      expected: TokenType.LeftBracket,
    })

    const node: ASTContractNode = {
      type: 'contract',
      name,
    }

    while( !match({
      expected: TokenType.RightBracket,
    }) ) {
      const { value: keyword } = consume({
        expected: TokenType.Identifier,
      })
      switch( keyword ) {
        case 'payload': {
          node.payload = consumeMultiplePropertyTypes()
          break
        }
        case 'query': {
          node.query = consumeMultiplePropertyTypes()
          break
        }
      }
    }

    consume({
      expected: TokenType.RightBracket,
    })
    return node
  }

  const consumeFunctionsBlock = (ast: ASTNode[]) => {
    consume({
      expected: TokenType.LeftBracket,
    })

    const functions: Record<string, AccessCondition> = {}
    while( !match({
      expected: TokenType.RightBracket,
    }) ) {
      if( match({
        expected: TokenType.AttributeName,
        value: 'include',
      }) ) {
        consume({
          expected: TokenType.AttributeName,
          value: 'include',
        })
        consume({
          expected: TokenType.LeftParens,
        })

        const { value: functionSetName } = consume({
          expected: TokenType.Identifier,
        })

        const functionset = getNode(ast, {
          type: 'functionset',
          name: functionSetName,
        })

        if( !functionset ) {
          throw new Error(`functionset "${functionSetName} not found"`)
        }

        Object.assign(functions, functionset.functions)
        consume({
          expected: TokenType.RightParens,
        })

        continue
      }

      const { value: functionName } = consume({
        expected: TokenType.Identifier,
      })
      functions[functionName] = false

      while( match({
        expected: TokenType.AttributeName,
        value: 'expose',
      }) ) {
        consume({
          expected: TokenType.AttributeName,
          value: 'expose',
        })
        functions[functionName] = true
      }
    }

    consume({
      expected: TokenType.RightBracket,
    })
    return functions
  }

  const consumeFunctionSet = (ast: ASTNode[]): ASTFunctionSetNode => {
    consume({
      expected: TokenType.Identifier,
      value: 'functionset',
    })
    const { value: name } = consume({
      expected: TokenType.Identifier,
    })
    const node: ASTFunctionSetNode = {
      type: 'functionset',
      name,
      functions: consumeFunctionsBlock(ast),
    }

    return node
  }

  const ast: ASTNode[] = []
  while( current < tokens.length ) {
    const { value: declType } = tokens[current]

    switch( declType ) {
      case 'collection': {
        ast.push(consumeCollection(ast))
        break
      }
      case 'contract': {
        ast.push(consumeContract())
        break
      }
      case 'functionset': {
        ast.push(consumeFunctionSet(ast))
        break
      }
      default:
        throw new Error(`invalid declaration type: "${declType}"`)
    }
  }

  return ast
}

export const compile = (input: string) => {
  const tokens = tokenize(input)

  const ast = parse(Array.from(tokens))
  return generateCode(ast)
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

collection Animal {
  properties {
    name str
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
    }
  }
  query
    | { properties { name str } }
    | { properties { age num } }
    | str
}
`

const output = compile(inputCode)
console.log(JSON.stringify(output, null, 2))

