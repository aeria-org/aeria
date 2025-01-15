import type { CollectionAction, CollectionActionEvent, CollectionActionFunction, CollectionActionRoute, CollectionActions, FileProperty, Property, RefProperty, SearchOptions, UserRole } from '@aeriajs/types'
import { DESCRIPTION_PRESETS, PROPERTY_FORMATS, PROPERTY_INPUT_ELEMENTS, PROPERTY_INPUT_TYPES } from '@aeriajs/types'
import { icons } from '@phosphor-icons/core'
import { Diagnostic } from './diagnostic.js'
import { TokenType, type Token, type Location } from './token.js'
import * as AST from './ast.js'
import * as guards from './guards.js'
import * as lexer from './lexer.js'

const MAX_ERROR_MESSAGE_ITEMS = 20
const ICON_NAMES = icons.map((icon) => icon.name)

export const locationMap = new WeakMap<symbol, Location>()

type StrictToken<TTokenType extends TokenType, TValue> = undefined extends TValue
  ? Token<TTokenType>
  : TValue extends readonly (infer E)[]
    ? Token<TTokenType, E>
    : Token<TTokenType, TValue>

const isFileProperty = (property: RefProperty | FileProperty): property is FileProperty => {
  return property.$ref === 'File'
}

export const parse = (tokens: (Token | undefined)[]) => {
  let index = 0
  const ast: AST.ProgramNode = {
    kind: 'program',
    collections: [],
    contracts: [],
    functionsets: [],
  }

  const errors: Diagnostic[] = []

  const next = () => {
    const token = tokens[index + 1]
    if( !token ) {
      throw new Diagnostic('unexpected EOF', current().location)
    }
    return token
  }

  const previous = () => {
    const token = tokens[index - 1]
    if( !token ) {
      throw new Diagnostic('invalid position')
    }
    return token
  }

  const current = () => {
    const token = tokens[index]
    if( !token ) {
      throw new Diagnostic('unexpected EOF', previous().location)
    }
    return token
  }

  const foldBrackets = () => {
    if( match(TokenType.LeftBracket) ) {
      index++
      while( !match(TokenType.RightBracket) ) {
        foldBrackets()
        index++
      }
    }
  }

  const match = (expected: TokenType, value?: unknown) => {
    const token = current()

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
    const token = current()
    if( match(expected, value) ) {
      index++
      return token as StrictToken<TTokenType, TValue>
    }

    let expectedValue: string | undefined
    if( value ) {
      expectedValue = Array.isArray(value)
        ? value.slice(0, MAX_ERROR_MESSAGE_ITEMS).map((elem) => `"${elem}"`).join(' | ')
        : `"${value}"`
    }

    if( Array.isArray(value) && value.length > MAX_ERROR_MESSAGE_ITEMS ) {
      expectedValue += ' | ...'
    }

    throw new Diagnostic(
      expectedValue
        ? `expected ${expected} with value ${expectedValue} but found ${token.type} with value "${token.value}" instead`
        : `expected ${expected} but found ${token.type} instead`,
      token.location,
    )
  }

  const recover = (keywords: readonly lexer.Keyword[]) => {
    let token: Token | undefined
    while ( token = tokens[++index] as Token | undefined ) {
      if( token.type === TokenType.Keyword && keywords.includes(token.value as lexer.Keyword) ) {
        break
      }
    }
  }

  const parseArray = <TTokenType extends TokenType>(type: TTokenType) => {
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
    return array as Token<TTokenType>['value'][]
  }

  const parseArrayBlock = <TValue>(value?: TValue) => {
    const array: unknown[] = []
    const symbols: symbol[] = []

    consume(TokenType.LeftBracket)

    while( !match(TokenType.RightBracket) ) {
      const { value: identifier, location } = consume(TokenType.Identifier, value)
      const elemSymbol = Symbol()

      array.push(identifier)
      symbols.push(elemSymbol)
      locationMap.set(elemSymbol, location)
    }

    consume(TokenType.RightBracket)
    return {
      value: array as TValue extends readonly (infer E)[] ? E[] : string[],
      symbols,
    }
  }

  const parseArrayBlockWithAttributes = () => {
    const array: Record<string, Record<string, unknown> | null> = {}
    let hasAttributes = false

    consume(TokenType.LeftBracket)

    while( !match(TokenType.RightBracket) ) {
      const { value: identifier } = consume(TokenType.Identifier)
      array[identifier] = {}

      while( match(TokenType.AttributeName) ) {
        hasAttributes = true

        const { value: attributeName } = consume(TokenType.AttributeName)
        if( match(TokenType.LeftParens) ) {
          consume(TokenType.LeftParens)
          consume(TokenType.RightParens)
        } else {
          array[identifier][attributeName] = true
        }
      }
    }

    consume(TokenType.RightBracket)
    return hasAttributes
      ? array
      : Object.keys(array)
  }

  const parsePropertyAttributeValue = (attributeName: string, property: Property, location: Location) => {
    const consumeBoolean = () => {
      if( match(TokenType.Boolean) ) {
        const { value } = consume(TokenType.Boolean)
        return value
      }
      return true
    }

    if( 'enum' in property && attributeName === 'values' ) {
      property.enum = parseArray(TokenType.QuotedString)
      return
    }

    switch( attributeName ) {
      case 'icon': {
        const { value } = consume(TokenType.QuotedString, ICON_NAMES)
        property[attributeName] = value
        return
      }
      case 'hint':
      case 'description': {
        const { value } = consume(TokenType.QuotedString)
        property[attributeName] = value
        return
      }
    }

    if( '$ref' in property ) {
      switch( attributeName ) {
        case 'purge':
        case 'inline': {
          property[attributeName] = consumeBoolean()
          return
        }
        case 'select':
        case 'form':
        case 'populate':
        case 'indexes': {
          property[attributeName] = parseArray(TokenType.Identifier)
          return
        }
        case 'populateDepth': {
          const { value } = consume(TokenType.Number)
          property[attributeName] = value
          return
        }
      }

      if( isFileProperty(property) ) {
        switch( attributeName ) {
          case 'extensions':
          case 'accept': {
            property[attributeName] = parseArray(TokenType.QuotedString)
            return
          }
        }
      }
    }

    if( 'type' in property ) {
      switch( property.type ) {
        case 'string': {
          switch( attributeName ) {
            case 'format': {
              const { value } = consume(TokenType.QuotedString, PROPERTY_FORMATS)
              property[attributeName] = value
              return
            }
            case 'mask': {
              if( match(TokenType.LeftSquareBracket) ) {
                property[attributeName] = parseArray(TokenType.QuotedString)
                return
              } else {
                const { value } = consume(TokenType.QuotedString)
                property[attributeName] = value
                return
              }
            }
            case 'maskedValue': {
              const { value } = consume(TokenType.Boolean)
              property[attributeName] = value
              return
            }
            case 'minLength':
            case 'maxLength': {
              const { value } = consume(TokenType.Number)
              property[attributeName] = value
              return
            }
            case 'inputType': {
              const { value } = consume(TokenType.QuotedString, PROPERTY_INPUT_TYPES)
              property[attributeName] = value
              return
            }
            case 'element': {
              const { value } = consume(TokenType.QuotedString, PROPERTY_INPUT_ELEMENTS)
              property[attributeName] = value
              return
            }
            case 'placeholder': {
              const { value } = consume(TokenType.QuotedString)
              property[attributeName] = value
              return
            }
          }
          break
        }
        case 'integer':
        case 'number': {
          switch( attributeName ) {
            case 'exclusiveMinimum':
            case 'exclusiveMaximum':
            case 'minimum':
            case 'maximum': {
              const { value } = consume(TokenType.Number)
              property[attributeName] = value
              return
            }
            case 'placeholder': {
              const { value } = consume(TokenType.QuotedString)
              property[attributeName] = value
              return
            }
          }
        }
      }
    }

    throw new Diagnostic(`invalid attribute name "${attributeName}"`, location)
  }

  const parsePropertyType = (options = {
    allowModifiers: false,
  }): AST.PropertyNode => {
    let property: AST.PropertyNode['property']
    let nestedProperties: Record<string, AST.PropertyNode> | undefined
    let modifierToken: Token<TokenType.Identifier> | undefined

    if( match(TokenType.LeftSquareBracket) ) {
      consume(TokenType.LeftSquareBracket)
      consume(TokenType.RightSquareBracket)

      const { property: items, nestedProperties } = parsePropertyType(options)
      property = {
        type: 'array',
        items,
      }

      return {
        kind: 'property',
        property,
        nestedProperties,
      }
    }

    if( options.allowModifiers ) {
      const nextToken = next()
      if( match(TokenType.Identifier) && (nextToken.type === TokenType.LeftBracket || nextToken.type === TokenType.Identifier) ) {
        modifierToken = consume(TokenType.Identifier)
      }
    }

    if( match(TokenType.LeftBracket) ) {
      consume(TokenType.LeftBracket)

      property = {
        type: 'object',
        properties: {},
        [AST.LOCATION_SYMBOL]: {
          attributes: {},
          arrays: {},
        },
      }

      while( !match(TokenType.RightBracket) ) {
        const { value: keyword, location } = current()
        switch( keyword ) {
          case 'writable':
          case 'required': {
            consume(TokenType.Keyword)
            const { value, symbols } = parseArrayBlock()
            property[keyword] = value
            property[AST.LOCATION_SYMBOL]!.arrays[keyword] = symbols
            break
          }
          case 'properties': {
            consume(TokenType.Keyword)
            nestedProperties = parsePropertiesBlock(options)
            break
          }
          default:
            throw new Diagnostic(`invalid keyword "${keyword}"`, location)
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
        const collection = ast.collections.find((node) => node.name === identifier)
        if( !collection ) {
          throw new Diagnostic(`invalid reference "${identifier}"`, location)
        }

        property = {
          $ref: identifier,
        }
      }
    }

    while( match(TokenType.AttributeName) ) {
      const { value: attributeName, location } = consume(TokenType.AttributeName)
      if( match(TokenType.LeftParens) ) {
        consume(TokenType.LeftParens)
        const attributeSymbol = Symbol()
        locationMap.set(attributeSymbol, next().location)

        property[AST.LOCATION_SYMBOL] ??= {
          attributes: {},
          arrays: {},
        }

        property[AST.LOCATION_SYMBOL].attributes[attributeName] = attributeSymbol

        parsePropertyAttributeValue(attributeName, property, location)
        consume(TokenType.RightParens)

      } else {
        parsePropertyAttributeValue(attributeName, property, location)
      }
    }

    const node: AST.PropertyNode = {
      kind: 'property',
      property,
      nestedProperties,
    }

    if( modifierToken ) {
      if( !guards.isValidPropertyModifier(modifierToken.value) ) {
        throw new Diagnostic(`invalid modifier: "${modifierToken.value}"`, modifierToken.location)
      }
      node.modifier = modifierToken.value
    }

    return node
  }

  const parsePropertiesBlock = (options = {
    allowModifiers: false,
  }) => {
    consume(TokenType.LeftBracket)

    const properties: Record<string, AST.PropertyNode> = {}
    while( !match(TokenType.RightBracket) ) {
      try {
        const { value: propName } = consume(TokenType.Identifier)
        properties[propName] = parsePropertyType(options)

        if( match(TokenType.Comma) ) {
          consume(TokenType.Comma)
        }
      } catch( err ) {
        if( err instanceof Diagnostic ) {
          errors.push(err)
          recoverLoop: while( true ) {
            switch( current().type ) {
              case TokenType.RightBracket:
              case TokenType.Identifier: {
                break recoverLoop
              }
            }

            while( match(TokenType.AttributeName) ) {
              index++
              if( match(TokenType.LeftParens) ) {
                index++
                while( !match(TokenType.RightParens) ) {
                  index++
                }
              }
            }

            index++
            foldBrackets()
          }
          continue
        }
      }
    }

    consume(TokenType.RightBracket)
    return properties
  }

  const parseMultiplePropertyTypes = (options = {
    allowModifiers: false,
  }) => {
    if( match(TokenType.Pipe) ) {
      consume(TokenType.Pipe)

      const properties = []
      while( index < tokens.length ) {
        properties.push(parsePropertyType(options))

        if( match(TokenType.Pipe) ) {
          consume(TokenType.Pipe)
        } else {
          break
        }
      }

      return properties
    }

    return parsePropertyType(options)
  }

  const parseCollection = (ast: AST.ProgramNode): AST.CollectionNode => {
    consume(TokenType.Keyword, 'collection')
    const { value: name } = consume(TokenType.Identifier)

    const node: AST.CollectionNode = {
      kind: 'collection',
      name,
      properties: {},
      [AST.LOCATION_SYMBOL]: {
        arrays: {},
      },
    }

    if( match(TokenType.Keyword, 'extends') ) {
      consume(TokenType.Keyword)
      const { value: packageName } = consume(TokenType.Identifier)
      consume(TokenType.Dot)

      const { value: symbolName } = consume(TokenType.Identifier)
      node.extends = {
        packageName,
        symbolName: symbolName[0].toLowerCase() + symbolName.slice(1),
      }
    }

    consume(TokenType.LeftBracket)

    while( !match(TokenType.RightBracket) ) {
      const { value: keyword, location } = consume(TokenType.Keyword, lexer.COLLECTION_KEYWORDS)
      try {
        switch( keyword ) {
          case 'owned': {
            if( match(TokenType.QuotedString, 'on-write') ) {
              node.owned = consume(TokenType.QuotedString).value === 'true'
            } else {
              node.owned = consume(TokenType.Boolean).value
            }
            break
          }
          case 'icon': {
            const { value } = consume(TokenType.QuotedString, ICON_NAMES)
            node.icon = value
            break
          }
          case 'properties': {
            node.properties = parsePropertiesBlock()
            break
          }
          case 'functions': {
            node.functions = parseFunctionsBlock(ast)
            break
          }
          case 'individualActions':
          case 'actions': {
            node[keyword] = parseActionsBlock()
            break
          }
          case 'required': {
            node.required = parseArrayBlockWithAttributes()
            break
          }
          case 'presets': {
            const { value, symbols } = parseArrayBlock(DESCRIPTION_PRESETS)
            node[keyword] = value
            node[AST.LOCATION_SYMBOL].arrays[keyword] = symbols
            break
          }
          case 'indexes':
          case 'form':
          case 'table':
          case 'filters': {
            const { value, symbols } = parseArrayBlock()
            node[keyword] = value
            node[AST.LOCATION_SYMBOL].arrays[keyword] = symbols
            break
          }
          case 'search': {
            node[keyword] = parseSearchBlock()
            break
          }
        }
      } catch( err ) {
        if( err instanceof Diagnostic ) {
          errors.push(err)
          recover(lexer.COLLECTION_KEYWORDS)
          continue
        }
      }
    }

    consume(TokenType.RightBracket)
    return node
  }

  const parseContract = (): AST.ContractNode => {
    consume(TokenType.Keyword, 'contract')
    const { value: name } = consume(TokenType.Identifier)
    consume(TokenType.LeftBracket)

    const node: AST.ContractNode = {
      kind: 'contract',
      name,
    }

    while( !match(TokenType.RightBracket) ) {
      const { value: keyword } = consume(TokenType.Keyword, lexer.CONTRACT_KEYWORDS)
      switch( keyword ) {
        case 'payload': {
          node.payload = parsePropertyType({
            allowModifiers: true,
          })
          break
        }
        case 'query': {
          node.query = parsePropertyType({
            allowModifiers: true,
          })
          break
        }
        case 'response': {
          node.response = parseMultiplePropertyTypes({
            allowModifiers: true,
          })
          break
        }
      }
    }

    consume(TokenType.RightBracket)
    return node
  }

  const parseFunctionsBlock = (ast: AST.ProgramNode) => {
    consume(TokenType.LeftBracket)

    const functions: AST.CollectionNode['functions'] = {}
    while( !match(TokenType.RightBracket) ) {
      if( match(TokenType.MacroName) ) {
        const { value: macroName } = consume(TokenType.MacroName, ['include'])

        switch( macroName ) {
          case 'include': {
            const { value: functionSetName, location } = consume(TokenType.Identifier)
            const functionset = ast.functionsets.find((node) => node.name === functionSetName)

            if( !functionset ) {
              throw new Diagnostic(`functionset "${functionSetName}" not found`, location)
            }

            Object.assign(functions, functionset.functions)
            consume(TokenType.RightParens)
          }

        }

        continue
      }

      const { value: functionName } = consume(TokenType.Identifier)
      functions[functionName] = {
        accessCondition: false,
      }

      while( match(TokenType.AttributeName, 'expose') ) {
        consume(TokenType.AttributeName, 'expose')
        if( match(TokenType.LeftParens) ) {
          consume(TokenType.LeftParens)
          if( match(TokenType.Boolean) ) {
            const { value } = consume(TokenType.Boolean)
            functions[functionName] = {
              accessCondition: value,
            }
          } else if( match(TokenType.QuotedString, [
            'unauthenticated',
            'unauthenticated-only',
          ]) ) {
            const { value } = consume(TokenType.QuotedString, [
              'unauthenticated',
              'unauthenticated-only',
            ])
            functions[functionName] = {
              accessCondition: value,
            }
          } else {
            const value = parseArray(TokenType.QuotedString)
            functions[functionName] = {
              accessCondition: value as readonly UserRole[],
            }
          }

          consume(TokenType.RightParens)

        } else {
          functions[functionName] = {
            accessCondition: true,
          }
        }
      }
    }

    consume(TokenType.RightBracket)
    return functions
  }

  const parseFunctionSet = (ast: AST.ProgramNode): AST.FunctionSetNode => {
    consume(TokenType.Keyword, 'functionset')
    const { value: name } = consume(TokenType.Identifier)
    const node: AST.FunctionSetNode = {
      kind: 'functionset',
      name,
      functions: parseFunctionsBlock(ast),
    }

    return node
  }

  const parseActionsBlock = () => {
    const actions: CollectionActions = {}

    consume(TokenType.LeftBracket)
    while( !match(TokenType.RightBracket) ) {
      const { value: actionName } = consume(TokenType.Identifier)
      consume(TokenType.LeftBracket)

      const baseSlots: CollectionAction = {}

      const slots: {
        route: CollectionActionRoute
        function: CollectionActionFunction
        event: CollectionActionEvent
      } = {
        route: {
          route: {
            name: '',
          },
        },
        function: {},
        event: {},
      }

      let actionType:
        | 'route'
        | 'function'
        | 'event'
        | undefined

      while( !match(TokenType.RightBracket) ) {
        const { value: keyword } = consume(TokenType.Keyword, lexer.COLLECTION_ACTIONS_KEYWORDS)
        switch( keyword ) {
          case 'icon': {
            const { value } = consume(TokenType.QuotedString, ICON_NAMES)
            baseSlots[keyword] = value
            break
          }
          case 'label': {
            const { value } = consume(TokenType.QuotedString)
            baseSlots[keyword] = value
            break
          }
          case 'ask':
          case 'button':
          case 'translate': {
            const { value } = consume(TokenType.Boolean)
            baseSlots[keyword] = value
            break
          }
          case 'roles':
          case 'requires': {
            const value = parseArray(TokenType.Identifier)
            baseSlots[keyword] = value
            break
          }
          case 'route': {
            const { value } = consume(TokenType.QuotedString)
            actionType = 'route'
            slots.route.route.name = value
            break
          }
          case 'setItem':
          case 'fetchItem':
          case 'clearItem': {
            const { value } = consume(TokenType.Boolean)
            slots.route.route[keyword] = value
            break
          }
          case 'function': {
            const { value } = consume(TokenType.QuotedString)
            actionType = 'function'
            slots.function.function = value
            break
          }
          case 'effect': {
            const { value } = consume(TokenType.QuotedString)
            slots.function.effect = value
            break
          }
          case 'selection': {
            const { value } = consume(TokenType.Boolean)
            slots.function.selection = value
            break
          }
          case 'event': {
            const { value } = consume(TokenType.QuotedString)
            actionType = 'event'
            slots.event.event = value
            break
          }
        }
      }

      if( actionType ) {
        actions[actionName] = {
          ...baseSlots,
          ...slots[actionType],
        }
      } else {
        actions[actionName] = baseSlots
      }

      consume(TokenType.RightBracket)
    }

    consume(TokenType.RightBracket)
    return actions
  }

  const parseSearchBlock = (): SearchOptions => {
    const searchSlots: Partial<SearchOptions> = {}
    const { location } = consume(TokenType.LeftBracket)
    while( !match(TokenType.RightBracket) ) {
      const { value: keyword } = consume(TokenType.Keyword, lexer.COLLECTION_SEARCH_KEYWORDS)
      switch( keyword ) {
        case 'placeholder': {
          const { value } = consume(TokenType.QuotedString)
          searchSlots[keyword] = value
          break
        }
        case 'exactMatches': {
          const { value } = consume(TokenType.Boolean)
          searchSlots[keyword] = value
          break
        }
        case 'indexes': {
          const { value } = parseArrayBlock()
          searchSlots[keyword] = value
          break
        }
      }
    }

    const { indexes } = searchSlots
    if( !indexes ) {
      throw new Diagnostic('"indexes" option is required', location)
    }

    consume(TokenType.RightBracket)

    return {
      ...searchSlots,
      indexes,
    }
  }

  while( index < tokens.length ) {
    const { value: declType, location } = current()

    try {
      switch( declType ) {
        case 'collection': {
          ast.collections.push(parseCollection(ast))
          break
        }
        case 'contract': {
          ast.contracts.push(parseContract())
          break
        }
        case 'functionset': {
          ast.functionsets.push(parseFunctionSet(ast))
          break
        }
        default:
          throw new Diagnostic(`invalid declaration type: "${declType}"`, location)
      }
    } catch( err ) {
      if( err instanceof Diagnostic ) {
        errors.push(err)
        recover(lexer.TOPLEVEL_KEYWORDS)
        continue
      }

      throw err
    }
  }

  return {
    ast,
    errors,
  }
}

