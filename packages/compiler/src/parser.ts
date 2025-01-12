import { Result, type Property } from '@aeriajs/types'
import * as AST from './ast.js'
import { TokenType, type Token, type Location } from './token.js'
import * as guards from './guards.js'

export class ParserError extends Error {
  constructor(public message: string, public location: Location) {
    super()
  }
}

type StrictToken<TTokenType extends TokenType, TValue> = undefined extends TValue
  ? Token<TTokenType>
  : TValue extends readonly (infer E)[]
    ? Token<TTokenType, E>
    : Token<TTokenType, TValue>

export const parse = (tokens: Token[]) => {
  let current = 0

  const match = (expected: TokenType, value?: unknown) => {
    const token = tokens[current]
    if( token.type === expected ) {
      if( value !== undefined ) {
        return Array.isArray(value)
          ? value.includes(token.value)
          : token.value === value
      }
      return true
    }

    return false
  }

  const consume = <TTokenType extends TokenType, const TValue>(expected: TTokenType, value?: TValue): StrictToken<TTokenType, TValue> => {
    const token = tokens[current]
    if( match(expected, value) ) {
      current++
      return token as StrictToken<TTokenType, TValue>
    }

    let expectedValue: string | undefined
    if( value ) {
      expectedValue = Array.isArray(value)
        ? value.map((elem) => `"${elem}"`).join(' | ')
        : `"${value}"`
    }

    throw new ParserError(
      expectedValue
        ? `expected ${expected} with value ${expectedValue} but found ${token.type} with value "${token.value}" instead`
        : `expected ${expected} but found ${token.type} instead`,
      token.location
    )
  }

  const consumeArray = (type: TokenType) => {
    consume(TokenType.LeftSquareBracket)

    const array: unknown[] = []
    while( !match(TokenType.RightSquareBracket) ) {
      const { value } = consume(type)
      array.push(value)

      if( match(TokenType.Comma) ) {
        consume(TokenType.Comma)
      }
    }

    consume(TokenType.RightSquareBracket)
    return array
  }

  const consumePropertyType = (options = {
    allowModifiers: false,
  }): AST.PropertyNode => {
    let property: Property
    let nestedProperties: Record<string, AST.PropertyNode> | undefined
    let modifierToken: Token<TokenType.Identifier> | undefined

    if( match(TokenType.LeftSquareBracket) ) {
      consume(TokenType.LeftSquareBracket)
      consume(TokenType.RightSquareBracket)

      const value = consumePropertyType(options)
      property = {
        type: 'array',
        items: value.property,
      }

      return {
        type: 'property',
        property,
      }
    }

    if( options.allowModifiers ) {
      if( match(TokenType.Identifier) && tokens[current + 1].type === TokenType.LeftBracket ) {
        modifierToken = consume(TokenType.Identifier)
      }
    }

    if( match(TokenType.LeftBracket) ) {
      consume(TokenType.LeftBracket)

      property = {
        type: 'object',
        properties: {},
      }

      while( !match(TokenType.RightBracket) ) {
        const { value: keyword, location } = tokens[current]
        switch( keyword ) {
          case 'properties': {
            consume(TokenType.Keyword, 'properties')
            nestedProperties = consumePropertiesBlock(options)
            break
          }
          default:
            throw new ParserError(`invalid keyword "${keyword}"`, location)
        }
      }

      consume(TokenType.RightBracket)

    } else {
      const { value: identifier, location } = consume(TokenType.Identifier)
      if( guards.isNativePropertyType(identifier) ) {
        switch( identifier ) {
          case 'enum': {
            property = {
              enum: [],
            }
            break
          }
          case 'date': {
            property = {
              type: 'string',
              format: 'date',
            }
            break
          }
          case 'datetime': {
            property = {
              type: 'string',
              format: 'date-time',
            }
            break
          }
          default:
            property = {
              type: AST.PropertyType[identifier],
            }
        }
      } else {
        const collection = AST.findNode(ast, {
          type: 'collection',
          name: identifier,
        })

        if( !collection ) {
          throw new ParserError(`invalid reference "${identifier}"`, location)
        }

        property = {
          $ref: identifier,
        }
      }
    }

    while( match(TokenType.AttributeName) ) {
      const { value: attributeName } = consume(TokenType.AttributeName)
      let insideParens = false
      if( match(TokenType.LeftParens) ) {
        consume(TokenType.LeftParens)
        insideParens = true
      }

      if( 'enum' in property && attributeName === 'values' ) {
        property.enum = consumeArray(TokenType.QuotedString)
      } else {
        const attributeValue = tokens[current++].value
        Object.assign(property, {
          [attributeName]: attributeValue,
        })
      }

      if( insideParens ) {
        consume(TokenType.RightParens)
      }
    }

    const node: AST.PropertyNode = {
      type: 'property',
      property,
      nestedProperties,
    }

    if( modifierToken ) {
      if( !guards.isValidPropertyModifier(modifierToken.value) ) {
        throw new ParserError(`invalid modifier: "${modifierToken.value}"`, modifierToken.location)
      }
      node.modifier = modifierToken.value
    }

    return node
  }

  const consumePropertiesBlock = (options = {
    allowModifiers: false,
  }) => {
    consume(TokenType.LeftBracket)

    const properties: Record<string, AST.PropertyNode> = {}
    while( !match(TokenType.RightBracket) ) {
      const { value: propName } = consume(TokenType.Identifier)
      properties[propName] = consumePropertyType(options)

      if( match(TokenType.Comma) ) {
        consume(TokenType.Comma)
      }
    }

    consume(TokenType.RightBracket)
    return properties
  }

  const consumeMultiplePropertyTypes = (options = {
    allowModifiers: false,
  }) => {
    if( match(TokenType.Pipe) ) {
      consume(TokenType.Pipe)

      const properties = []
      while( current < tokens.length ) {
        properties.push(consumePropertyType(options))

        if( match(TokenType.Pipe) ) {
          consume(TokenType.Pipe)
        } else {
          break
        }
      }

      return properties
    }

    return consumePropertyType(options)
  }

  const consumeCollection = (ast: AST.Node[]): AST.CollectionNode => {
    consume(TokenType.Keyword, 'collection')
    const { value: name } = consume(TokenType.Identifier)

    const node: AST.CollectionNode = {
      type: 'collection',
      name,
      properties: {},
    }

    if( match(TokenType.Keyword, 'extends') ) {
      consume(TokenType.Keyword)
      const { value: packageName } = consume(TokenType.Identifier)
      consume(TokenType.Dot)

      const { value: symbolName } = consume(TokenType.Identifier)
      node.extends = {
        packageName,
        symbolName,
      }
    }

    consume(TokenType.LeftBracket)

    while( !match(TokenType.RightBracket) ) {
      const { value: keyword } = consume(TokenType.Keyword, ['owned', 'properties', 'functions', 'actions'])
      switch( keyword ) {
        case 'owned': {
          let value: string | boolean
          if( match(TokenType.QuotedString, 'on-write') ) {
            value = consume(TokenType.QuotedString).value
          } else {
            value = consume(TokenType.Boolean).value
          }

          node.owned = value === 'true'
          break
        }
        case 'properties': {
          node.properties = consumePropertiesBlock()
          break
        }
        case 'functions': {
          node.functions = consumeFunctionsBlock(ast)
          break
        }
        case 'actions': {
          consumeActionsBlock()
          break
        }
      }
    }

    consume(TokenType.RightBracket)
    return node
  }

  const consumeContract = (): AST.ContractNode => {
    consume(TokenType.Keyword, 'contract')
    const { value: name } = consume(TokenType.Identifier)
    consume(TokenType.LeftBracket)

    const node: AST.ContractNode = {
      type: 'contract',
      name,
    }

    while( !match(TokenType.RightBracket) ) {
      const { value: keyword } = consume(TokenType.Keyword, ['payload', 'query', 'response'])
      switch( keyword ) {
        case 'payload': {
          node.payload = consumeMultiplePropertyTypes({
            allowModifiers: true,
          })
          break
        }
        case 'query': {
          node.query = consumeMultiplePropertyTypes({
            allowModifiers: true,
          })
          break
        }
        case 'response': {
          node.response = consumeMultiplePropertyTypes({
            allowModifiers: true,
          })
          break
        }
      }
    }

    consume(TokenType.RightBracket)
    return node
  }

  const consumeFunctionsBlock = (ast: AST.Node[]) => {
    consume(TokenType.LeftBracket)

    const functions: AST.CollectionNode['functions'] = {}
    while( !match(TokenType.RightBracket) ) {
      if( match(TokenType.AttributeName, 'include') ) {
        consume(TokenType.AttributeName)
        consume(TokenType.LeftParens)

        const { value: functionSetName, location } = consume(TokenType.Identifier)

        const functionset = AST.findNode(ast, {
          type: 'functionset',
          name: functionSetName,
        })

        if( !functionset ) {
          throw new ParserError(`functionset "${functionSetName} not found"`, location)
        }

        Object.assign(functions, functionset.functions)
        consume(TokenType.RightParens)

        continue
      }

      const { value: functionName } = consume(TokenType.Identifier)
      functions[functionName] = {
        accessCondition: false,
      }

      while( match(TokenType.AttributeName, 'expose') ) {
        consume(TokenType.AttributeName, 'expose')
        functions[functionName] = {
          accessCondition: true,
        }
      }
    }

    consume(TokenType.RightBracket)
    return functions
  }

  const consumeFunctionSet = (ast: AST.Node[]): AST.FunctionSetNode => {
    consume(TokenType.Keyword, 'functionset')
    const { value: name } = consume(TokenType.Identifier)
    const node: AST.FunctionSetNode = {
      type: 'functionset',
      name,
      functions: consumeFunctionsBlock(ast),
    }

    return node
  }

  const consumeActionsBlock = () => {
    consume(TokenType.LeftBracket)
    while( !match(TokenType.RightBracket) ) {
      const { value: actionName } = consume(TokenType.Identifier)
      consume(TokenType.LeftBracket)
      while( !match(TokenType.RightBracket) ) {
        const { value: keyword } = consume(TokenType.Keyword, ['name'])
        switch( keyword ) {
          case 'name':
            //
            break
        }
      }

      consume(TokenType.RightBracket)
    }

    consume(TokenType.RightBracket)
  }

  const ast: AST.Node[] = []
  try {
    while( current < tokens.length ) {
      const { value: declType, location } = tokens[current]

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
          throw new ParserError(`invalid declaration type: "${declType}"`, location)
      }
    }

    return Result.result(ast)

  } catch( err ) {
    if( err instanceof ParserError ) {
      console.log('erro!')
      console.log(err.location)

      return Result.error(err)
    }

    throw err
  }
}

