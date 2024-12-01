import type { Property, ContractWithRoles, AccessCondition } from '@aeriajs/types'
import { tokenize, TokenType, type Token } from './lexer'
import { generateCode } from './codegen'
import { findNode } from './ast'

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

  const match = (expected: TokenType, value?: string) => {
    const token = tokens[current]
    if( token.type === expected ) {
      if( value !== undefined ) {
        return token.value === value
      }
      return true
    }

    return false
  }

  const consume = (expected: TokenType, value?: string) => {
    const token = tokens[current]
    if( match(expected, value) ) {
      current++
      return token
    }

    throw new Error(`expected "${expected}" but found "${token.type}" instead`)
  }

  const consumePropertyType = (): Property => {
    let property: Property

    if( match(TokenType.LeftBracket) ) {
      consume(TokenType.LeftBracket)

      property = {
        type: 'object',
        properties: {},
      }

      while( !match(TokenType.RightBracket) ) {
        const { value: keyword } = tokens[current]
        switch( keyword ) {
          case 'properties': {
            consume(TokenType.Identifier, 'properties')
            property.properties = consumePropertiesBlock()
            break
          }
          default:
            throw new Error(`invalid keyword "${keyword}"`)
        }
      }

      consume(TokenType.RightBracket)

    } else {
      const { value: propType } = consume(TokenType.Identifier)
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
          throw new Error(`invalid property type "${propType}"`)
      }
    }

    while( match(TokenType.AttributeName) ) {
      const { value: attributeName } = consume(TokenType.AttributeName)
      let insideParens = false
      if( match(TokenType.LeftParens) ) {
        consume(TokenType.LeftParens)
        insideParens = true
      }

      const attributeValue = tokens[current++].value

      if( insideParens ) {
        consume(TokenType.RightParens)
      }

      Object.assign(property, {
        [attributeName]: attributeValue,
      })
    }

    return property
  }

  const consumePropertiesBlock = () => {
    consume(TokenType.LeftBracket)

    const properties: Record<string, Property> = {}
    while( !match(TokenType.RightBracket) ) {
      const { value: propName } = consume(TokenType.Identifier)
      properties[propName] = consumePropertyType()
    }

    consume(TokenType.RightBracket)
    return properties
  }

  const consumeMultiplePropertyTypes = () => {
    if( match(TokenType.Pipe) ) {
      consume(TokenType.Pipe)

      const properties = []
      while( current < tokens.length ) {
        properties.push(consumePropertyType())

        if( match(TokenType.Pipe) ) {
          consume(TokenType.Pipe)
        } else {
          break
        }
      }

      return properties
    }

    return consumePropertyType()
  }

  const consumeCollection = (ast: ASTNode[]): ASTCollectionNode => {
    consume(TokenType.Identifier, 'collection')
    const { value: name } = consume(TokenType.Identifier)
    consume(TokenType.LeftBracket)

    const node: ASTCollectionNode = {
      type: 'collection',
      name,
      properties: {},
    }

    while( !match(TokenType.RightBracket) ) {
      const { value: propType } = tokens[current]
      switch( propType ) {
        case 'properties': {
          consume(TokenType.Identifier, 'properties')
          node.properties = consumePropertiesBlock()
          break
        }
        case 'functions': {
          consume(TokenType.Identifier, 'functions')
          node.functions = consumeFunctionsBlock(ast)
          break
        }
        default:
          throw new Error(`invalid token "${propType}"`)
      }
    }

    consume(TokenType.RightBracket)
    return node
  }

  const consumeContract = (): ASTContractNode => {
    consume(TokenType.Identifier, 'contract')
    const { value: name } = consume(TokenType.Identifier)
    consume(TokenType.LeftBracket)

    const node: ASTContractNode = {
      type: 'contract',
      name,
    }

    while( !match(TokenType.RightBracket) ) {
      const { value: keyword } = consume(TokenType.Identifier)
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

    consume(TokenType.RightBracket)
    return node
  }

  const consumeFunctionsBlock = (ast: ASTNode[]) => {
    consume(TokenType.LeftBracket)

    const functions: Record<string, AccessCondition> = {}
    while( !match(TokenType.RightBracket) ) {
      if( match(TokenType.AttributeName, 'include') ) {
        consume(TokenType.AttributeName, 'include')
        consume(TokenType.LeftParens)

        const { value: functionSetName } = consume(TokenType.Identifier)

        const functionset = findNode(ast, {
          type: 'functionset',
          name: functionSetName,
        })

        if( !functionset ) {
          throw new Error(`functionset "${functionSetName} not found"`)
        }

        Object.assign(functions, functionset.functions)
        consume(TokenType.RightParens)

        continue
      }

      const { value: functionName } = consume(TokenType.Identifier)
      functions[functionName] = false

      while( match(TokenType.AttributeName, 'expose') ) {
        consume(TokenType.AttributeName, 'expose')
        functions[functionName] = true
      }
    }

    consume(TokenType.RightBracket)
    return functions
  }

  const consumeFunctionSet = (ast: ASTNode[]): ASTFunctionSetNode => {
    consume(TokenType.Identifier, 'functionset')
    const { value: name } = consume(TokenType.Identifier)
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

