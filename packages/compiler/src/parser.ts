import type { ArrayProperty, CollectionAction, CollectionActionEvent, CollectionActionFunction, CollectionActionRoute, CollectionActions, Condition, FileProperty, FinalCondition, FinalOperator, JsonSchema, LayoutName, LayoutOptions, Property, RefProperty, SearchOptions, UserRole } from '@aeriajs/types'
import { TokenType, type Token, type Location } from './token.js'
import { DESCRIPTION_PRESETS, LAYOUT_NAMES, PROPERTY_ARRAY_ELEMENTS, PROPERTY_FORMATS, PROPERTY_INPUT_ELEMENTS, PROPERTY_INPUT_TYPES } from '@aeriajs/types'
import { icons } from '@phosphor-icons/core'
import { Diagnostic } from './diagnostic.js'
import * as AST from './ast.js'
import * as guards from './guards.js'
import * as lexer from './lexer.js'

const MAX_ERROR_MESSAGE_ITEMS = 20
const ICON_NAMES = icons.map((icon) => icon.name)

export const locationMap = new WeakMap<symbol, Location>()
export const memoTable: {
  roles?: string[]
} = {}

type StrictToken<TTokenType extends TokenType, TValue> = undefined extends TValue
  ? Token<TTokenType>
  : TValue extends readonly (infer E)[]
    ? Token<TTokenType, E>
    : Token<TTokenType, TValue>

const isFileProperty = (property: RefProperty | FileProperty): property is FileProperty => {
  return property.$ref === 'File'
}

const checkForValidRoles = (roles: string[], symbols: symbol[]) => {
  if( memoTable.roles ) {
    for( const [i, role] of roles.entries() ) {
      const symbol = symbols[i]
      if( !memoTable.roles.includes(role) ) {
        const location = locationMap.get(symbol)
        throw new Diagnostic(`invalid role "${role}"`, location)
      }
    }
  }

  return roles as readonly Extract<UserRole, string>[]
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
    if( match(TokenType.LeftBracket) ) {
      advance()
      while( !match(TokenType.RightBracket) ) {
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
      if( token.type === TokenType.Keyword && keywords.includes(token.value as lexer.Keyword) ) {
        break
      }
    }
  }

  const parseArray = <TTokenType extends TokenType>(types: TTokenType[]) => {
    const { location: openingLocation } = consume(TokenType.LeftSquareBracket)

    const array: unknown[] = []
    const symbols: symbol[] = []
    let type: TokenType | undefined

    for( const typeCandidate of types ) {
      if( match(typeCandidate) ) {
        type = typeCandidate
        break
      }
    }

    if( !type ) {
      throw new Diagnostic(`array got an invalid type, accepted ones are: ${types.join(' | ')}`, openingLocation)
    }

    while( !match(TokenType.RightSquareBracket) ) {
      const { value, location } = consume(type)
      const elemSymbol = Symbol()

      array.push(value)
      symbols.push(elemSymbol)
      locationMap.set(elemSymbol, location)

      if( match(TokenType.Comma) ) {
        consume(TokenType.Comma)
      }
    }

    consume(TokenType.RightSquareBracket)
    return {
      value: array as Token<TTokenType>['value'][],
      symbols,
    }
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

      if( match(TokenType.Comma) ) {
        consume(TokenType.Comma)
      }
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
      property.enum = parseArray([
        TokenType.QuotedString,
        TokenType.Number,
      ]).value
      return
    }

    if( 'const' in property && attributeName === 'value' ) {
      const token = current()
      advance()

      switch( token.type ) {
        case TokenType.Number:
        case TokenType.Boolean:
        case TokenType.Null:
        case TokenType.QuotedString: {
          property.const = (token as Token<typeof token.type>).value
          return
        }
        default: {
          throw new Diagnostic(`const received invalid value: "${token.value}"`, location)
        }
      }
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
      case 'translate': {
        property[attributeName] = consumeBoolean()
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
          property[attributeName] = parseArray([TokenType.Identifier]).value
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
            property[attributeName] = parseArray([TokenType.QuotedString]).value
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
                property[attributeName] = parseArray([TokenType.QuotedString]).value
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
          break
        }
        case 'array': {
          switch (attributeName) {
            case 'uniqueItems': {
              const { value } = consume(TokenType.Boolean)
              property[attributeName] = value
              return
            }
            case 'element': {
              const { value } = consume(TokenType.QuotedString, PROPERTY_ARRAY_ELEMENTS)
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
    let nestedProperties: AST.PropertyNode['nestedProperties']
    let nestedAdditionalProperties: AST.PropertyNode['nestedAdditionalProperties']
    let modifierToken: StrictToken<typeof TokenType.Identifier, keyof typeof AST.PropertyModifiers> | undefined

    const typeSymbol = Symbol()

    if( options.allowModifiers ) {
      const nextToken = next()
      const currentTokenValue = current().value
      if( match(TokenType.Identifier) && typeof currentTokenValue === 'string' && guards.isValidPropertyModifier(currentTokenValue) && (nextToken.type === TokenType.LeftBracket || nextToken.type === TokenType.LeftSquareBracket || nextToken.type === TokenType.Identifier)) {
        modifierToken = consume(TokenType.Identifier)
      }
    }

    if( match(TokenType.LeftSquareBracket) ) {
      consume(TokenType.LeftSquareBracket)
      const arrayProperty: Omit<Extract<AST.PropertyNode['property'], { type: 'array' }>, 'items' > = {
        type: 'array',
      }
      while( !match(TokenType.RightSquareBracket) ) {
        const attributeSymbol = Symbol()
        arrayProperty[AST.LOCATION_SYMBOL] ??= {
          type: typeSymbol,
          attributes: {},
          arrays: {},
        }

        if (match(TokenType.Range)) {
          const { value: rangeSeparator } = consume(TokenType.Range)
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

        const { value: attributeName, location } = consume(TokenType.AttributeName)
        if( match(TokenType.LeftParens) ) {
          consume(TokenType.LeftParens)
          locationMap.set(attributeSymbol, next().location)

          arrayProperty[AST.LOCATION_SYMBOL].attributes[attributeName] = attributeSymbol

          parsePropertyAttributeValue(attributeName, arrayProperty as AST.PropertyNode['property'], location)
          consume(TokenType.RightParens)

        } else {
          parsePropertyAttributeValue(attributeName, arrayProperty as AST.PropertyNode['property'], location)
        }
      }
      consume(TokenType.RightSquareBracket)

      const { property: items, nestedProperties } = parsePropertyType(options)
      property = {
        ...arrayProperty,
        items,
      }

      locationMap.set(typeSymbol, current().location)

      return {
        kind: 'property',
        property,
        nestedProperties,
      }
    }

    locationMap.set(typeSymbol, current().location)

    if( match(TokenType.LeftBracket) ) {
      consume(TokenType.LeftBracket)

      property = {
        type: 'object',
        properties: {},
        [AST.LOCATION_SYMBOL]: {
          type: typeSymbol,
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
          case 'additionalProperties': {
            consume(TokenType.Keyword)
            if( match(TokenType.Boolean) ) {
              nestedAdditionalProperties = consume(TokenType.Boolean).value
            } else {
              nestedAdditionalProperties = parsePropertyType()
            }
            break
          }
          default:
            throw new Diagnostic(`invalid keyword "${keyword}"`, location)
        }
      }

      consume(TokenType.RightBracket)

    } else {
      const { value: identifier } = consume(TokenType.Identifier)
      if( guards.isNativePropertyType(identifier) ) {
        switch( identifier ) {
          case 'enum': {
            property = {
              enum: [],
            }
            break
          }
          case 'const': {
            property = {
              const: null,
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
        property = {
          $ref: identifier,
          [AST.LOCATION_SYMBOL]: {
            type: typeSymbol,
            attributes: {},
            arrays: {},
          },
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
          type: typeSymbol,
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
      nestedAdditionalProperties,
    }

    if( modifierToken ) {
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
          recoverLoop: for( ;; ) {
            switch( current().type ) {
              case TokenType.RightBracket:
              case TokenType.Identifier: {
                break recoverLoop
              }
            }

            while( match(TokenType.AttributeName) ) {
              advance()
              if( match(TokenType.LeftParens) ) {
                advance()
                while( !match(TokenType.RightParens) ) {
                  advance()
                }
              }
            }

            advance()
            foldBrackets()
          }
          continue
        }

        throw err
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

  const parseAccessCondition = (options = {
    arrayBlock: false,
  }) => {
    if( match(TokenType.Boolean) ) {
      const { value } = consume(TokenType.Boolean)
      return value
    } else if( match(TokenType.QuotedString, [
      'unauthenticated',
      'unauthenticated-only',
    ]) ) {
      const { value } = consume(TokenType.QuotedString, [
        'unauthenticated',
        'unauthenticated-only',
      ])
      return value
    } else {
      const { value, symbols } = options.arrayBlock
        ? parseArrayBlock()
        : parseArray([TokenType.QuotedString])

      return checkForValidRoles(value, symbols)
    }
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
      const { value: keyword } = consume(TokenType.Keyword, lexer.COLLECTION_KEYWORDS)
      try {
        switch( keyword ) {
          case 'owned': {
            if( match(TokenType.Boolean) ) {
              node.owned = consume(TokenType.Boolean).value
            } else {
              node.owned = consume(TokenType.QuotedString, [
                'always',
                'on-write',
              ]).value
            }
            break
          }
          case 'icon': {
            const { value } = consume(TokenType.QuotedString, ICON_NAMES)
            node[keyword] = value
            break
          }
          case 'properties': {
            node[keyword] = parsePropertiesBlock()
            break
          }
          case 'functions': {
            node[keyword] = parseFunctionsBlock(ast)
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
          case 'tableMeta':
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
          case 'layout': {
            node[keyword] = parseLayoutBlock()
            break
          }
          case 'formLayout': {
            node[keyword] = parseFormLayoutBlock()
            break
          }
        }
      } catch( err ) {
        if( err instanceof Diagnostic ) {
          errors.push(err)
          recover(lexer.COLLECTION_KEYWORDS)
          continue
        }

        throw err
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
        case 'roles': {
          node.roles = parseAccessCondition({
            arrayBlock: true,
          })
          break
        }
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
      try {
        if( match(TokenType.MacroName) ) {
          const { value: macroName } = consume(TokenType.MacroName, ['include'])

          switch( macroName ) {
            /* eslint-disable-next-line */
            case 'include': {
              const { value: functionSetName, location } = consume(TokenType.Identifier)
              const functionset = ast.functionsets.find((node) => node.name === functionSetName)

              if( !functionset ) {
                throw new Diagnostic(`functionset "${functionSetName}" not found`, location)
              }

              Object.assign(functions, functionset.functions)
              consume(TokenType.RightParens)
              break
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
            functions[functionName] = {
              accessCondition: parseAccessCondition(),
            }

            consume(TokenType.RightParens)

          } else {
            functions[functionName] = {
              accessCondition: true,
            }
          }
        }
      } catch( err ) {
        if( err instanceof Diagnostic ) {
          let token: Token | undefined
          while ( token = tokens[++index] ) {
            if( token.type === TokenType.Identifier || token.type === TokenType.RightBracket ) {
              break
            }
          }

          errors.push(err)
          continue
        }

        throw err
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
          case 'roles': {
            const { value, symbols } = parseArray([TokenType.Identifier])
            const roles = checkForValidRoles(value, symbols)
            baseSlots[keyword] = roles
            break
          }
          case 'requires': {
            const { value } = parseArray([TokenType.Identifier])
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

  const parseLayoutBlock = (): AST.LayoutNode => {
    let name: LayoutName | undefined
    const options: LayoutOptions = {}
    const optionsSymbols: AST.LayoutNode[typeof AST.LOCATION_SYMBOL]['options'] = {}

    const { location } = consume(TokenType.LeftBracket)
    while( !match(TokenType.RightBracket) ) {
      const { value: keyword } = consume(TokenType.Keyword, lexer.COLLECTION_LAYOUT_KEYWORDS)
      switch( keyword ) {
        case 'name': {
          name = consume(TokenType.QuotedString, LAYOUT_NAMES).value
          break
        }
        case 'options': {
          consume(TokenType.LeftBracket)

          while( !match(TokenType.RightBracket) ) {
            const { value: optionsKeyword } = consume(TokenType.Keyword, lexer.COLLECTION_LAYOUT_OPTIONS_KEYWORDS)
            switch( optionsKeyword ) {
              case 'active':
              case 'title':
              case 'picture':
              case 'badge': {
                const { value, location } = consume(TokenType.Identifier)
                const symbol = Symbol()
                options[optionsKeyword] = value
                optionsSymbols[optionsKeyword] = symbol
                locationMap.set(symbol, location)
                break
              }
              case 'information': {
                if( match(TokenType.LeftBracket) ) {
                  const { value, symbols } = parseArrayBlock()
                  options[optionsKeyword] = value
                  optionsSymbols[optionsKeyword] = symbols
                } else {
                  const { value, location } = consume(TokenType.Identifier)
                  const symbol = Symbol()
                  options[optionsKeyword] = value
                  optionsSymbols[optionsKeyword] = symbol
                  locationMap.set(symbol, location)
                }
                break
              }
              case 'translateBadge': {
                const { value } = consume(TokenType.Boolean)
                options[optionsKeyword] = value
                break
              }
            }
          }
        }

          consume(TokenType.RightBracket)
          break
      }
    }

    if( !name ) {
      throw new Diagnostic('layout must have a "name" property', location)
    }

    consume(TokenType.RightBracket)

    return {
      kind: 'layout',
      name,
      options,
      [AST.LOCATION_SYMBOL]: {
        options: optionsSymbols,
      },
    }
  }

  const parseFormLayoutBlock = (): AST.FormLayoutNode => {
    const fields: AST.FormLayoutNode['fields'] = {}
    const node: AST.FormLayoutNode = {
      kind: 'formLayout',
      fields,
      [AST.LOCATION_SYMBOL]: {
        fields: {},
      },
    }

    consume(TokenType.LeftBracket)
    while( !match(TokenType.RightBracket) ) {
      const { value: keyword, location: keywordLocation } = consume(TokenType.Keyword, lexer.COLLECTION_FORM_LAYOUT_KEYWORDS)
      switch( keyword ) {
        case 'fields': {
          consume(TokenType.LeftBracket)
          while( !match(TokenType.RightBracket) ) {
            const { value: identifier, location: identifierLocation } = consume(TokenType.Identifier)
            const identifierSymbol = Symbol()
            locationMap.set(identifierSymbol, identifierLocation)

            fields[identifier] ??= {}
            node[AST.LOCATION_SYMBOL].fields[identifier] = {
              name: identifierSymbol,
              field: {},
            }

            consume(TokenType.LeftBracket)
            while( !match(TokenType.RightBracket) ) {
              const { value: keyword, location: keywordLocation } = consume(TokenType.Keyword, lexer.COLLECTION_FORM_LAYOUT_KEYWORDS)

              switch( keyword ) {
                case 'if': {
                  const ifTerms: [string, symbol][] = []
                  fields[identifier].if = parseCondition(ifTerms)
                  node[AST.LOCATION_SYMBOL].terms = ifTerms
                  break
                }
                case 'span':
                case 'verticalSpacing': {
                  fields[identifier].span = consume(TokenType.Number).value
                  break
                }
                case 'separator': {
                  fields[identifier].separator = match(TokenType.Boolean)
                    ? consume(TokenType.Boolean).value
                    : consume(TokenType.QuotedString, [
                      'top',
                      'bottom',
                    ]).value
                  break
                }
                default: {
                  throw new Diagnostic(`invalid keyword "${keyword}"`, keywordLocation)
                }
              }
            }

            consume(TokenType.RightBracket)
          }

          consume(TokenType.RightBracket)
          break
        }
        default: {
          throw new Diagnostic(`invalid keyword "${keyword}"`, keywordLocation)
        }
      }
    }

    consume(TokenType.RightBracket)

    return node
  }

  const parseCondition = (symbols: [string, symbol][] = []): Condition => {
    if( match(TokenType.LeftParens) ) {
      consume(TokenType.LeftParens)

      let operatorType: 'or' | 'and' | undefined, newOp = operatorType

      const conditions: Condition[] = []
      while( !match(TokenType.RightParens) ) {
        conditions.push(parseCondition(symbols))
        if( match(TokenType.RightParens) ) {
          break
        }

        const { value: operatorSymbol, location } = consume(TokenType.Operator)

        switch( operatorSymbol ) {
          case '&&': newOp = 'and'; break
          case '||': newOp = 'or'; break
          default: {
            throw new Diagnostic(`unsupported operator: "${operatorSymbol}"`, location)
          }
        }

        if( operatorType && operatorType !== newOp ) {
          throw new Diagnostic('having "and" or "or" in the same expression is not supported, please use parenthesis', location)
        }

        operatorType = newOp
      }

      consume(TokenType.RightParens)

      switch( operatorType ) {
        case 'and': {
          return {
            and: conditions,
          }
        }
        case 'or': {
          return {
            or: conditions,
          }
        }
        default: {
          return conditions[0]
        }
      }
    }

    if( match(TokenType.Operator, '!') ) {
      consume(TokenType.Operator)
      return {
        not: parseCondition(symbols),
      }
    }

    const { value: term1, location: term1Location } = consume(TokenType.Identifier)
    const term1Symbol = Symbol()
    locationMap.set(term1Symbol, term1Location)
    symbols.push([
      term1,
      term1Symbol,
    ])

    if( !match(TokenType.Operator, lexer.FINAL_OPERATORS) ) {
      return {
        operator: 'truthy',
        term1,
      }
    }

    const { value: operatorSymbol, location } = consume(TokenType.Operator)

    let term2: FinalCondition<JsonSchema>['term2']
    if( match(TokenType.LeftParens) ) {
      term2 = parseCondition(symbols)
    } else {
      term2 = current().value
      advance()
    }

    let operator: FinalOperator
    switch( operatorSymbol ) {
      case '==': operator = 'equal'; break
      case 'in': operator = 'in'; break
      case '>=': operator = 'gte'; break
      case '<=': operator = 'lte'; break
      case '>': operator = 'gt'; break
      case '<': operator = 'lt'; break
      default: {
        throw new Diagnostic(`unsupported operator: "${operatorSymbol}"`, location)
      }
    }

    return {
      operator,
      term1,
      term2,
    }
  }

  while( index < tokens.length ) {
    const { value: declType, location } = current()

    try {
      switch( declType ) {
        case 'collection': {
          const collection = parseCollection(ast)
          if( collection.name === 'User' ) {
            const { properties } = collection
            if( 'roles' in properties && 'items' in properties.roles.property && 'enum' in properties.roles.property.items ) {
              memoTable.roles = properties.roles.property.items.enum as string[]
            }
          }

          ast.collections.push(collection)
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

