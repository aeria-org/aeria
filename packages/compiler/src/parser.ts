import type { Property } from '@aeriajs/types'
import { Result } from '@aeriajs/types'
import { TokenType, type Token } from './lexer'

import * as AST from './ast'
import * as guards from './guards'
import { type Diagnostic } from './diagnostic'

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

  const consume = (expected: TokenType, value?: string): Result.Either<Diagnostic, Token> => {
    const token = tokens[current]
    if( match(expected, value) ) {
      current++
      return Result.result(token)
    }
    console.log(token)
    return Result.error({
      message: `expected "${expected}"${value
        ? ` with value "${value}"`
        : ''} but found "${token.type}" instead`,
      location: token.location,
    })
  }

  const consumeArray = (type: TokenType) => {
    const { error: leftBracketError } = consume(TokenType.LeftSquareBracket)
    if(leftBracketError){
      return Result.error(leftBracketError)
    }

    const array: unknown[] = []
    while( !match(TokenType.RightSquareBracket) ) {
      const { error, result: token } = consume(type)
      if(error){
        return Result.error(error)
      }
      array.push(token.value)

      if( match(TokenType.Comma) ) {
        const{ error } = consume(TokenType.Comma)
        if(error){
          return Result.error(error)
        }
      }
    }

    const { error: rightBracketError } = consume(TokenType.RightSquareBracket)
    if(rightBracketError){
      return Result.error(rightBracketError)
    }

    return Result.result(array)
  }

  const consumePropertyType = (options = {
    allowModifiers: false,
  }): Result.Either<Diagnostic, AST.PropertyNode> => {
    let property: Property
    let nestedProperties: Record<string, AST.PropertyNode> | undefined
    let modifier: string | undefined

    if( options.allowModifiers ) {
      if( match(TokenType.Identifier) && tokens[current + 1].type === TokenType.LeftBracket ) {

        const { error, result: token } = consume(TokenType.Identifier)
        if(error){
          return Result.error(error)
        }
        modifier = token.value
      }
    }

    if( match(TokenType.LeftBracket) ) {
      const { error: leftBracketError } = consume(TokenType.LeftBracket)
      if(leftBracketError){
        return Result.error(leftBracketError)
      }
      property = {
        type: 'object',
        properties: {},
      }

      while( !match(TokenType.RightBracket) ) {
        const keyword = tokens[current].value
        switch( keyword ) {
          case 'properties': {
            const { error: keywordError } = consume(TokenType.Keyword, 'properties')
            if(keywordError){
              return Result.error(keywordError)
            }
            const { error: propBlockError, result: propBlock } = consumePropertiesBlock(options)
            if(propBlockError){
              return Result.error(propBlockError)
            }
            nestedProperties = propBlock
            break
          }
          default:
            return Result.error({
              message: `invalid keyword "${keyword}"`,
              location: tokens[current].location,
            })
        }
      }

      const { error: rightBracketError } = consume(TokenType.RightBracket)
      if(rightBracketError){
        return Result.error(rightBracketError)
      }
    } else {
      const { error, result: token } = consume(TokenType.Identifier)
      if(error){
        return Result.error(error)
      }
      const identifier = token.value
      if( guards.isNativePropertyType(identifier) ) {
        switch( identifier ) {
          case 'enum': {
            property = {
              enum: [],
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
          return Result.error({
            message: `invalid reference "${identifier}"`,
            location: token.location,
          })
        }

        property = {
          $ref: identifier,
        }
      }
    }

    while( match(TokenType.AttributeName) ) {
      const { error, result: token } = consume(TokenType.AttributeName)
      if(error){
        return Result.error(error)
      }
      const attributeName = token.value
      let insideParens = false
      if( match(TokenType.LeftParens) ) {
        const { error: leftParensError } = consume(TokenType.LeftParens)
        if(leftParensError){
          return Result.error(leftParensError)
        }
        insideParens = true
      }

      if( 'enum' in property && attributeName === 'values' ) {
        const{ error, result } = consumeArray(TokenType.QuotedString)
        if(error){
          return Result.error(error)
        }
        property.enum = result
      } else {
        const attributeValue = tokens[current++].value
        Object.assign(property, {
          [attributeName]: attributeValue,
        })
      }

      if( insideParens ) {
        const { error: rightParensError } = consume(TokenType.RightParens)
        if(rightParensError){
          return Result.error(rightParensError)
        }
      }
    }

    const node: AST.PropertyNode = {
      type: 'property',
      property,
      nestedProperties,
    }

    if( modifier ) {
      if( !guards.isValidPropertyModifier(modifier) ) {
        return Result.error({
          message: `invalid modifier: "${modifier}"` as never,
          location: tokens[current].location,
        })
        //throw new Error(`invalid modifier: "${modifier}"`)
      }
      node.modifier = modifier
    }

    return Result.result(node)
  }

  const consumePropertiesBlock = (options = {
    allowModifiers: false,
  }): Result.Either<Diagnostic, Record<string, AST.PropertyNode>> => {
    const { error: leftBracketError } = consume(TokenType.LeftBracket)
    if(leftBracketError){
      return Result.error(leftBracketError)
    }
    const properties: Record<string, AST.PropertyNode> = {}
    while( !match(TokenType.RightBracket) ) {
      //const { value: propName } = consume(TokenType.Identifier)
      const { error, result: token } = consume(TokenType.Identifier)
      if(error){
        return Result.error(error)
      }
      const propName = token.value
      const { error: consumePropertyTypeError, result: prop } = consumePropertyType(options)
      if(consumePropertyTypeError){
        return Result.error(consumePropertyTypeError)
      }
      properties[propName] = prop
      if( match(TokenType.Comma) ) {
        const { error: commaError } = consume(TokenType.Comma)
        if(commaError){
          return Result.error(commaError)
        }
        consume(TokenType.Comma)
      }
    }

    const { error: rightBracketError } = consume(TokenType.RightBracket)
    if(rightBracketError){
      return Result.error(rightBracketError)
    }

    return Result.result(properties)
  }

  const consumeMultiplePropertyTypes = (options = {
    allowModifiers: false,
  }): Result.Either<Diagnostic, AST.PropertyNode[] | AST.PropertyNode> => {
    if( match(TokenType.Pipe) ) {
      const { error: pipeError } = consume(TokenType.Pipe)
      if(pipeError){
        return Result.error(pipeError)
      }

      const properties = []
      while( current < tokens.length ) {
        const { error,result } = consumePropertyType(options)
        if(error){
          return Result.error(error)
        }
        properties.push(result)

        if( match(TokenType.Pipe) ) {
          const { error: pipeError } = consume(TokenType.Pipe)
          if(pipeError){
            return Result.error(pipeError)
          }
        } else {
          break
        }
      }

      return Result.result(properties)
    }

    return consumePropertyType(options)
  }

  const consumeCollection = (ast: AST.Node[]): Result.Either<Diagnostic,AST.CollectionNode> => {
    const { error: keywordError } = consume(TokenType.Keyword, 'collection')
    if(keywordError){
      return Result.error(keywordError)
    }

    const { error, result } = consume(TokenType.Identifier)
    if(error){
      return Result.error(error)
    }
    const name = result.value

    const node: AST.CollectionNode = {
      type: 'collection',
      name,
      properties: {},
    }

    if( match(TokenType.Keyword, 'extends') ) {
      const { error: keywordError } = consume(TokenType.Keyword)
      if(keywordError){
        return Result.error(keywordError)
      }

      const { error: packageNameIdentifierError, result: packageNameIdentifier } = consume(TokenType.Identifier)
      if(packageNameIdentifierError){
        return Result.error(packageNameIdentifierError)
      }
      const packageName = packageNameIdentifier.value

      const { error: dotError } = consume(TokenType.Dot)
      if(dotError){
        return Result.error(dotError)
      }

      const { error: symbolIdentifierError, result: symbolIdentifier } = consume(TokenType.Identifier)
      if(symbolIdentifierError){
        return Result.error(symbolIdentifierError)
      }
      const symbolName = symbolIdentifier.value
      node.extends = {
        packageName,
        symbolName,
      }
    }

    const { error: leftBracketError } = consume(TokenType.LeftBracket)
    if(leftBracketError){
      return Result.error(leftBracketError)
    }

    while( !match(TokenType.RightBracket) ) {
      const{ error, result } = consume(TokenType.Keyword)
      if(error){
        return Result.error(error)
      }
      const keyword = result.value

      switch( keyword ) {
        case 'owned': {
          let value: string
          if( match(TokenType.QuotedString, 'on-write') ) {
            const{ error, result } = consume(TokenType.QuotedString)
            if(error){
              return Result.error(error)
            }
            value = result.value
          } else {
            const{ error, result } = consume(TokenType.Boolean)
            if(error){
              return Result.error(error)
            }
            value = result.value
          }

          node.owned = value === 'true'
          break
        }
        case 'properties': {
          const{ error, result } = consumePropertiesBlock()
          if(error){
            return Result.error(error)
          }
          node.properties = result
          break
        }
        case 'functions': {
          const{ error, result } = consumeFunctionsBlock(ast)
          if(error){
            return Result.error(error)
          }
          node.functions = result
          break
        }
        default:
          return Result.error({
            message: `invalid token "${keyword}"`,
            location: tokens[current].location,
          })
      }
    }

    const { error: rightBracketError } = consume(TokenType.RightBracket)
    if(rightBracketError){
      return Result.error(rightBracketError)
    }
    return Result.result(node)
  }

  const consumeContract = (): Result.Either<Diagnostic,AST.ContractNode> => {
    const { error: keywordError } = consume(TokenType.Keyword, 'contract')
    if(keywordError){
      return Result.error(keywordError)
    }

    const { error, result } = consume(TokenType.Identifier)
    if(error){
      return Result.error(error)
    }
    const name = result.value

    const { error: leftBracketError } = consume(TokenType.LeftBracket)
    if(leftBracketError){
      return Result.error(leftBracketError)
    }

    const node: AST.ContractNode = {
      type: 'contract',
      name,
    }

    while( !match(TokenType.RightBracket) ) {
      const { error, result } = consume(TokenType.Keyword)
      if(error){
        return Result.error(error)
      }
      const keyword = result.value
      switch( keyword ) {
        case 'payload': {
          const { error, result } = consumeMultiplePropertyTypes({
            allowModifiers: true,
          })
          if(error){
            return Result.error(error)
          }
          node.payload = result
          break
        }
        case 'query': {
          const { error, result } = consumeMultiplePropertyTypes({
            allowModifiers: true,
          })
          if(error){
            return Result.error(error)
          }
          node.query = result
          break
        }
        case 'response': {
          const { error, result } = consumeMultiplePropertyTypes({
            allowModifiers: true,
          })
          if(error){
            return Result.error(error)
          }
          node.response = result
          break
        }
      }
    }

    const { error: rightBracketError } = consume(TokenType.RightBracket)
    if(rightBracketError){
      return Result.error(rightBracketError)
    }

    return Result.result(node)
  }

  const consumeFunctionsBlock = (ast: AST.Node[]) => {
    const { error: leftBracketError } = consume(TokenType.LeftBracket)
    if(leftBracketError){
      return Result.error(leftBracketError)
    }

    const functions: AST.CollectionNode['functions'] = {}
    while( !match(TokenType.RightBracket) ) {
      if( match(TokenType.AttributeName, 'include') ) {
        const { error: attributeNameError } = consume(TokenType.AttributeName)
        if(attributeNameError){
          return Result.error(attributeNameError)
        }

        const { error: leftParensError } = consume(TokenType.LeftParens)
        if(leftParensError){
          return Result.error(leftParensError)
        }

        const{ error, result } = consume(TokenType.Identifier)
        if(error){
          return Result.error(error)
        }

        const functionSetName = result.value

        const functionset = AST.findNode(ast, {
          type: 'functionset',
          name: functionSetName,
        })

        if( !functionset ) {
          return Result.error({
            message: `functionset "${functionSetName} not found"`,
            location: tokens[current].location,
          })
        }

        for (const key in functionset.functions) {
          functions[key] = {
            accessCondition: functionset.functions[key].accessCondition,
            fromFunctionSet: true,
          }
        }

        const { error: rightParensError } = consume(TokenType.RightParens)
        if(rightParensError){
          return Result.error(rightParensError)
        }

        continue
      }

      const{ error, result: token } = consume(TokenType.Identifier)
      if(error){
        return Result.error(error)
      }

      functions[token.value] = {
        accessCondition: false,
      }

      while( match(TokenType.AttributeName, 'expose') ) {
        const { error: attributeNameError, result: token } = consume(TokenType.AttributeName, 'expose')
        if(attributeNameError){
          return Result.error(attributeNameError)
        }

        functions[token.value] = {
          accessCondition: true,
        }
      }
    }

    const { error: rightBracketError } = consume(TokenType.RightBracket)
    if(rightBracketError){
      return Result.error(rightBracketError)
    }

    return Result.result(functions)
  }

  const consumeFunctionSet = (ast: AST.Node[]): Result.Either<Diagnostic,AST.FunctionSetNode> => {
    const { error: keywordError } = consume(TokenType.Keyword, 'functionset')
    if(keywordError){
      return Result.error(keywordError)
    }
    const { error, result } = consume(TokenType.Identifier)
    if(error){
      return Result.error(error)
    }
    const name = result.value

    const { error: functionBlockError, result: functionBlock } = consumeFunctionsBlock(ast)
    if(functionBlockError){
      return Result.error(functionBlockError)
    }

    const node: AST.FunctionSetNode = {
      type: 'functionset',
      name,
      functions: functionBlock,
    }

    return Result.result(node)
  }

  const ast: AST.Node[] = []
  while( current < tokens.length ) {
    const declType = tokens[current].value

    switch( declType ) {
      case 'collection': {
        const{ error, result } = consumeCollection(ast)
        if(error){
          return Result.error(error)
        }
        ast.push(result)
        break
      }
      case 'contract': {
        const{ error, result } = consumeContract()
        if(error){
          return Result.error(error)
        }
        ast.push(result)
        break
      }
      case 'functionset': {
        const{ error, result } = consumeFunctionSet(ast)
        if(error){
          return Result.error(error)
        }
        ast.push(result)
        break
      }
      default:
        return Result.error({
          message: `invalid declaration type: "${declType}"`,
          location: tokens[current].location,
        })
    }
  }

  return ast
}

