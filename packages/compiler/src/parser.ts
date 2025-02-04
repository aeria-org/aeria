import type { ArrayProperty, CollectionAction, CollectionActionEvent, CollectionActionFunction, CollectionActionRoute, CollectionActions, FileProperty, Property, RefProperty, SearchOptions, UserRole } from '@aeriajs/types'
import type { TokenType, Token, Location } from './token.js'
import { TokenTypes } from './token.js'
import { DESCRIPTION_PRESETS, PROPERTY_ARRAY_ELEMENTS, PROPERTY_FORMATS, PROPERTY_INPUT_ELEMENTS, PROPERTY_INPUT_TYPES } from '@aeriajs/types'
import { icons } from '@phosphor-icons/core'
import { Diagnostic } from './diagnostic.js'
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

  const advance = () => index++

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
    if( match(TokenTypes.LeftBracket) ) {
      advance()
      while( !match(TokenTypes.RightBracket) ) {
        foldBrackets()
        advance()
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
      advance()
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
    while ( token = tokens[++index] ) {
      if( token.type === TokenTypes.Keyword && keywords.includes(token.value as lexer.Keyword) ) {
        break
      }
    }
  }

  const parseArray = <TTokenType extends TokenType>(type: TTokenType) => {
    consume(TokenTypes.LeftSquareBracket)

    const array: unknown[] = []
    while( !match(TokenTypes.RightSquareBracket) ) {
      const { value } = consume(type)
      array.push(value)

      if( match(TokenTypes.Comma) ) {
        consume(TokenTypes.Comma)
      }
    }

    consume(TokenTypes.RightSquareBracket)
    return array as Token<TTokenType>['value'][]
  }

  const parseArrayBlock = <TValue>(value?: TValue) => {
    const array: unknown[] = []
    const symbols: symbol[] = []

    consume(TokenTypes.LeftBracket)

    while( !match(TokenTypes.RightBracket) ) {
      const { value: identifier, location } = consume(TokenTypes.Identifier, value)
      const elemSymbol = Symbol()

      array.push(identifier)
      symbols.push(elemSymbol)
      locationMap.set(elemSymbol, location)
    }

    consume(TokenTypes.RightBracket)
    return {
      value: array as TValue extends readonly (infer E)[] ? E[] : string[],
      symbols,
    }
  }

  const parseArrayBlockWithAttributes = () => {
    const array: Record<string, Record<string, unknown> | null> = {}
    let hasAttributes = false

    consume(TokenTypes.LeftBracket)

    while( !match(TokenTypes.RightBracket) ) {
      const { value: identifier } = consume(TokenTypes.Identifier)
      array[identifier] = {}

      while( match(TokenTypes.AttributeName) ) {
        hasAttributes = true

        const { value: attributeName } = consume(TokenTypes.AttributeName)
        if( match(TokenTypes.LeftParens) ) {
          consume(TokenTypes.LeftParens)
          consume(TokenTypes.RightParens)
        } else {
          array[identifier][attributeName] = true
        }
      }
    }

    consume(TokenTypes.RightBracket)
    return hasAttributes
      ? array
      : Object.keys(array)
  }

  const parsePropertyAttributeValue = (attributeName: string, property: Property, location: Location) => {
    const consumeBoolean = () => {
      if( match(TokenTypes.Boolean) ) {
        const { value } = consume(TokenTypes.Boolean)
        return value
      }
      return true
    }

    if( 'enum' in property && attributeName === 'values' ) {
      property.enum = parseArray(TokenTypes.QuotedString)
      return
    }

    switch( attributeName ) {
      case 'icon': {
        const { value } = consume(TokenTypes.QuotedString, ICON_NAMES)
        property[attributeName] = value
        return
      }
      case 'hint':
      case 'description': {
        const { value } = consume(TokenTypes.QuotedString)
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
          property[attributeName] = parseArray(TokenTypes.Identifier)
          return
        }
        case 'populateDepth': {
          const { value } = consume(TokenTypes.Number)
          property[attributeName] = value
          return
        }
      }

      if( isFileProperty(property) ) {
        switch( attributeName ) {
          case 'extensions':
          case 'accept': {
            property[attributeName] = parseArray(TokenTypes.QuotedString)
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
              const { value } = consume(TokenTypes.QuotedString, PROPERTY_FORMATS)
              property[attributeName] = value
              return
            }
            case 'mask': {
              if( match(TokenTypes.LeftSquareBracket) ) {
                property[attributeName] = parseArray(TokenTypes.QuotedString)
                return
              } else {
                const { value } = consume(TokenTypes.QuotedString)
                property[attributeName] = value
                return
              }
            }
            case 'maskedValue': {
              const { value } = consume(TokenTypes.Boolean)
              property[attributeName] = value
              return
            }
            case 'minLength':
            case 'maxLength': {
              const { value } = consume(TokenTypes.Number)
              property[attributeName] = value
              return
            }
            case 'inputType': {
              const { value } = consume(TokenTypes.QuotedString, PROPERTY_INPUT_TYPES)
              property[attributeName] = value
              return
            }
            case 'element': {
              const { value } = consume(TokenTypes.QuotedString, PROPERTY_INPUT_ELEMENTS)
              property[attributeName] = value
              return
            }
            case 'placeholder': {
              const { value } = consume(TokenTypes.QuotedString)
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
              const { value } = consume(TokenTypes.Number)
              property[attributeName] = value
              return
            }
            case 'placeholder': {
              const { value } = consume(TokenTypes.QuotedString)
              property[attributeName] = value
              return
            }
          }
          break
        }
        case 'array': {
          switch (attributeName) {
            case 'uniqueItems': {
              const { value } = consume(TokenTypes.Boolean)
              property[attributeName] = value
              return
            }
            case 'element': {
              const { value } = consume(TokenTypes.QuotedString, PROPERTY_ARRAY_ELEMENTS)
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
    let modifierToken: Token<typeof TokenTypes.Identifier> | undefined

    if( match(TokenTypes.LeftSquareBracket) ) {
      consume(TokenTypes.LeftSquareBracket)
      const arrayProperty: Omit<Extract<AST.PropertyNode['property'], { type: 'array' }>, 'items' > = {
        type: 'array',
      }
      while( !match(TokenTypes.RightSquareBracket) ) {
        const attributeSymbol = Symbol()
        arrayProperty[AST.LOCATION_SYMBOL] ??= {
          attributes: {},
          arrays: {},
        }

        if (match(TokenTypes.Range)) {
          const { value: rangeSeparator } = consume(TokenTypes.Range)
          let attributeName: keyof ArrayProperty

          const minItems = rangeSeparator[0]
          if (!isNaN(minItems)) {
            attributeName = 'minItems'
            arrayProperty[attributeName] = minItems,
            arrayProperty[AST.LOCATION_SYMBOL].attributes[attributeName] = attributeSymbol
          }

          const maxItems = rangeSeparator[1]
          if (!isNaN(maxItems)) {
            attributeName = 'maxItems'
            arrayProperty[attributeName] = maxItems
            arrayProperty[AST.LOCATION_SYMBOL].attributes[attributeName] = attributeSymbol
          }

          continue
        }

        const { value: attributeName, location } = consume(TokenTypes.AttributeName)
        if( match(TokenTypes.LeftParens) ) {
          consume(TokenTypes.LeftParens)
          locationMap.set(attributeSymbol, next().location)

          arrayProperty[AST.LOCATION_SYMBOL].attributes[attributeName] = attributeSymbol

          parsePropertyAttributeValue(attributeName, arrayProperty as AST.PropertyNode['property'], location)
          consume(TokenTypes.RightParens)

        } else {
          parsePropertyAttributeValue(attributeName, arrayProperty as AST.PropertyNode['property'], location)
        }
      }
      consume(TokenTypes.RightSquareBracket)

      const { property: items, nestedProperties } = parsePropertyType(options)
      property = {
        ...arrayProperty,
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
      if( match(TokenTypes.Identifier) && (nextToken.type === TokenTypes.LeftBracket || nextToken.type === TokenTypes.Identifier) ) {
        modifierToken = consume(TokenTypes.Identifier)
      }
    }

    if( match(TokenTypes.LeftBracket) ) {
      consume(TokenTypes.LeftBracket)

      property = {
        type: 'object',
        properties: {},
        [AST.LOCATION_SYMBOL]: {
          attributes: {},
          arrays: {},
        },
      }

      while( !match(TokenTypes.RightBracket) ) {
        const { value: keyword, location } = current()
        switch( keyword ) {
          case 'writable':
          case 'required': {
            consume(TokenTypes.Keyword)
            const { value, symbols } = parseArrayBlock()
            property[keyword] = value
            property[AST.LOCATION_SYMBOL]!.arrays[keyword] = symbols
            break
          }
          case 'properties': {
            consume(TokenTypes.Keyword)
            nestedProperties = parsePropertiesBlock(options)
            break
          }
          default:
            throw new Diagnostic(`invalid keyword "${keyword}"`, location)
        }
      }

      consume(TokenTypes.RightBracket)

    } else {
      const { value: identifier, location } = consume(TokenTypes.Identifier)
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

    while( match(TokenTypes.AttributeName) ) {
      const { value: attributeName, location } = consume(TokenTypes.AttributeName)
      if( match(TokenTypes.LeftParens) ) {
        consume(TokenTypes.LeftParens)
        const attributeSymbol = Symbol()
        locationMap.set(attributeSymbol, next().location)

        property[AST.LOCATION_SYMBOL] ??= {
          attributes: {},
          arrays: {},
        }

        property[AST.LOCATION_SYMBOL].attributes[attributeName] = attributeSymbol

        parsePropertyAttributeValue(attributeName, property, location)
        consume(TokenTypes.RightParens)

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
    consume(TokenTypes.LeftBracket)

    const properties: Record<string, AST.PropertyNode> = {}
    while( !match(TokenTypes.RightBracket) ) {
      try {
        const { value: propName } = consume(TokenTypes.Identifier)
        properties[propName] = parsePropertyType(options)

        if( match(TokenTypes.Comma) ) {
          consume(TokenTypes.Comma)
        }
      } catch( err ) {
        if( err instanceof Diagnostic ) {
          errors.push(err)
          recoverLoop: for( ;; ) {
            switch( current().type ) {
              case TokenTypes.RightBracket:
              case TokenTypes.Identifier: {
                break recoverLoop
              }
            }

            while( match(TokenTypes.AttributeName) ) {
              advance()
              if( match(TokenTypes.LeftParens) ) {
                advance()
                while( !match(TokenTypes.RightParens) ) {
                  advance()
                }
              }
            }

            advance()
            foldBrackets()
          }
          continue
        }
      }
    }

    consume(TokenTypes.RightBracket)
    return properties
  }

  const parseMultiplePropertyTypes = (options = {
    allowModifiers: false,
  }) => {
    if( match(TokenTypes.Pipe) ) {
      consume(TokenTypes.Pipe)

      const properties = []
      while( index < tokens.length ) {
        properties.push(parsePropertyType(options))

        if( match(TokenTypes.Pipe) ) {
          consume(TokenTypes.Pipe)
        } else {
          break
        }
      }

      return properties
    }

    return parsePropertyType(options)
  }

  const parseCollection = (ast: AST.ProgramNode): AST.CollectionNode => {
    consume(TokenTypes.Keyword, 'collection')
    const { value: name } = consume(TokenTypes.Identifier)

    const node: AST.CollectionNode = {
      kind: 'collection',
      name,
      properties: {},
      [AST.LOCATION_SYMBOL]: {
        arrays: {},
      },
    }

    if( match(TokenTypes.Keyword, 'extends') ) {
      consume(TokenTypes.Keyword)
      const { value: packageName } = consume(TokenTypes.Identifier)
      consume(TokenTypes.Dot)

      const { value: symbolName } = consume(TokenTypes.Identifier)
      node.extends = {
        packageName,
        symbolName: symbolName[0].toLowerCase() + symbolName.slice(1),
      }
    }

    consume(TokenTypes.LeftBracket)

    while( !match(TokenTypes.RightBracket) ) {
      const { value: keyword } = consume(TokenTypes.Keyword, lexer.COLLECTION_KEYWORDS)
      try {
        switch( keyword ) {
          case 'owned': {
            if( match(TokenTypes.QuotedString, ['always', 'on-write']) ) {
              node.owned = consume(TokenTypes.QuotedString).value as AST.CollectionNode['owned']
            }
            break
          }
          case 'icon': {
            const { value } = consume(TokenTypes.QuotedString, ICON_NAMES)
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

    consume(TokenTypes.RightBracket)
    return node
  }

  const parseContract = (): AST.ContractNode => {
    consume(TokenTypes.Keyword, 'contract')
    const { value: name } = consume(TokenTypes.Identifier)
    consume(TokenTypes.LeftBracket)

    const node: AST.ContractNode = {
      kind: 'contract',
      name,
    }

    while( !match(TokenTypes.RightBracket) ) {
      const { value: keyword } = consume(TokenTypes.Keyword, lexer.CONTRACT_KEYWORDS)
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

    consume(TokenTypes.RightBracket)
    return node
  }

  const parseFunctionsBlock = (ast: AST.ProgramNode) => {
    consume(TokenTypes.LeftBracket)

    const functions: AST.CollectionNode['functions'] = {}
    while( !match(TokenTypes.RightBracket) ) {
      if( match(TokenTypes.MacroName) ) {
        const { value: macroName } = consume(TokenTypes.MacroName, ['include'])

        switch( macroName ) {
          case 'include': {
            const { value: functionSetName, location } = consume(TokenTypes.Identifier)
            const functionset = ast.functionsets.find((node) => node.name === functionSetName)

            if( !functionset ) {
              throw new Diagnostic(`functionset "${functionSetName}" not found`, location)
            }

            Object.assign(functions, functionset.functions)
            consume(TokenTypes.RightParens)
          }

        }

        continue
      }

      const { value: functionName } = consume(TokenTypes.Identifier)
      functions[functionName] = {
        accessCondition: false,
      }

      while( match(TokenTypes.AttributeName, 'expose') ) {
        consume(TokenTypes.AttributeName, 'expose')
        if( match(TokenTypes.LeftParens) ) {
          consume(TokenTypes.LeftParens)
          if( match(TokenTypes.Boolean) ) {
            const { value } = consume(TokenTypes.Boolean)
            functions[functionName] = {
              accessCondition: value,
            }
          } else if( match(TokenTypes.QuotedString, [
            'unauthenticated',
            'unauthenticated-only',
          ]) ) {
            const { value } = consume(TokenTypes.QuotedString, [
              'unauthenticated',
              'unauthenticated-only',
            ])
            functions[functionName] = {
              accessCondition: value,
            }
          } else {
            const value = parseArray(TokenTypes.QuotedString)
            functions[functionName] = {
              accessCondition: value as readonly UserRole[],
            }
          }

          consume(TokenTypes.RightParens)

        } else {
          functions[functionName] = {
            accessCondition: true,
          }
        }
      }
    }

    consume(TokenTypes.RightBracket)
    return functions
  }

  const parseFunctionSet = (ast: AST.ProgramNode): AST.FunctionSetNode => {
    consume(TokenTypes.Keyword, 'functionset')
    const { value: name } = consume(TokenTypes.Identifier)
    const node: AST.FunctionSetNode = {
      kind: 'functionset',
      name,
      functions: parseFunctionsBlock(ast),
    }

    return node
  }

  const parseActionsBlock = () => {
    const actions: CollectionActions = {}

    consume(TokenTypes.LeftBracket)
    while( !match(TokenTypes.RightBracket) ) {
      const { value: actionName } = consume(TokenTypes.Identifier)
      consume(TokenTypes.LeftBracket)

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

      while( !match(TokenTypes.RightBracket) ) {
        const { value: keyword } = consume(TokenTypes.Keyword, lexer.COLLECTION_ACTIONS_KEYWORDS)
        switch( keyword ) {
          case 'icon': {
            const { value } = consume(TokenTypes.QuotedString, ICON_NAMES)
            baseSlots[keyword] = value
            break
          }
          case 'label': {
            const { value } = consume(TokenTypes.QuotedString)
            baseSlots[keyword] = value
            break
          }
          case 'ask':
          case 'button':
          case 'translate': {
            const { value } = consume(TokenTypes.Boolean)
            baseSlots[keyword] = value
            break
          }
          case 'roles':
          case 'requires': {
            const value = parseArray(TokenTypes.Identifier)
            baseSlots[keyword] = value
            break
          }
          case 'route': {
            const { value } = consume(TokenTypes.QuotedString)
            actionType = 'route'
            slots.route.route.name = value
            break
          }
          case 'setItem':
          case 'fetchItem':
          case 'clearItem': {
            const { value } = consume(TokenTypes.Boolean)
            slots.route.route[keyword] = value
            break
          }
          case 'function': {
            const { value } = consume(TokenTypes.QuotedString)
            actionType = 'function'
            slots.function.function = value
            break
          }
          case 'effect': {
            const { value } = consume(TokenTypes.QuotedString)
            slots.function.effect = value
            break
          }
          case 'selection': {
            const { value } = consume(TokenTypes.Boolean)
            slots.function.selection = value
            break
          }
          case 'event': {
            const { value } = consume(TokenTypes.QuotedString)
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

      consume(TokenTypes.RightBracket)
    }

    consume(TokenTypes.RightBracket)
    return actions
  }

  const parseSearchBlock = (): SearchOptions => {
    const searchSlots: Partial<SearchOptions> = {}
    const { location } = consume(TokenTypes.LeftBracket)
    while( !match(TokenTypes.RightBracket) ) {
      const { value: keyword } = consume(TokenTypes.Keyword, lexer.COLLECTION_SEARCH_KEYWORDS)
      switch( keyword ) {
        case 'placeholder': {
          const { value } = consume(TokenTypes.QuotedString)
          searchSlots[keyword] = value
          break
        }
        case 'exactMatches': {
          const { value } = consume(TokenTypes.Boolean)
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

    consume(TokenTypes.RightBracket)

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

