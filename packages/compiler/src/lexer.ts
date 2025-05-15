import { TokenType, type Token, type Location } from './token.js'
import { Diagnostic } from './diagnostic.js'

type TokenValue = Token['value'] | string

type TokenConfig = {
  type:
    | TokenType
    | null
  matcher:
    | RegExp
    | string
    | readonly string[]
  valueExtractor?: (value: string) => TokenValue
  construct?: (value: TokenValue) => TokenValue
  condition?: (state: LexerState, lastToken?: Token) => boolean
}

type LexerState = {
  variableScopeStack: boolean[]
  variableExpressionStack: boolean[]
}

export const COLLECTION_KEYWORDS = [
  'actions',
  'additionalProperties',
  'filters',
  'form',
  'formLayout',
  'functions',
  'icon',
  'indexes',
  'individualActions',
  'layout',
  'owned',
  'presets',
  'properties',
  'required',
  'search',
  'table',
  'tableMeta',
] as const

export const COLLECTION_ACTIONS_KEYWORDS = [
  'ask',
  'button',
  'clearItem',
  'effect',
  'event',
  'fetchItem',
  'function',
  'icon',
  'label',
  'params',
  'query',
  'requires',
  'roles',
  'route',
  'selection',
  'setItem',
  'translate',
] as const

export const COLLECTION_SEARCH_KEYWORDS = [
  'indexes',
  'placeholder',
  'exactMatches',
] as const

export const COLLECTION_LAYOUT_KEYWORDS = [
  'name',
  'options',
] as const

export const COLLECTION_LAYOUT_OPTIONS_KEYWORDS = [
  'title',
  'picture',
  'badge',
  'information',
  'active',
  'translateBadge',
] as const

export const COLLECTION_FORM_LAYOUT_KEYWORDS = [
  'fields',
  'if',
  'span',
  'verticalSpacing',
  'separator',
] as const

export const CONTRACT_KEYWORDS = [
  'roles',
  'payload',
  'query',
  'response',
] as const

export const TOPLEVEL_KEYWORDS = [
  'collection',
  'contract',
  'functionset',
] as const

export const MISC_KEYWORDS = ['extends'] as const

export type Keyword =
  | typeof COLLECTION_KEYWORDS[number]
  | typeof COLLECTION_ACTIONS_KEYWORDS[number]
  | typeof COLLECTION_SEARCH_KEYWORDS[number]
  | typeof COLLECTION_LAYOUT_KEYWORDS[number]
  | typeof COLLECTION_LAYOUT_OPTIONS_KEYWORDS[number]
  | typeof COLLECTION_FORM_LAYOUT_KEYWORDS[number]
  | typeof CONTRACT_KEYWORDS[number]
  | typeof TOPLEVEL_KEYWORDS[number]
  | typeof MISC_KEYWORDS[number]

export const KEYWORDS = ([] as Keyword[]).concat(
  COLLECTION_KEYWORDS,
  COLLECTION_ACTIONS_KEYWORDS,
  COLLECTION_SEARCH_KEYWORDS,
  COLLECTION_LAYOUT_KEYWORDS,
  COLLECTION_LAYOUT_OPTIONS_KEYWORDS,
  COLLECTION_FORM_LAYOUT_KEYWORDS,
  CONTRACT_KEYWORDS,
  TOPLEVEL_KEYWORDS,
  MISC_KEYWORDS,
)

export const FINAL_OPERATORS = [
  '==',
  'in',
  '>=',
  '<=',
  '>',
  '<',
  '!',
] as const

export const LOGICAL_OPERATORS = [
  '&&',
  '||',
] as const

const keywordsSet = new Set<string>()
for( const keyword of KEYWORDS ) {
  keywordsSet.add(keyword)
}

const TOKENS: TokenConfig[] = [
  {
    type: null,
    matcher: /\r?[ \t]+/,
  },
  {
    type: TokenType.LineBreak,
    matcher: '\n',
  },
  {
    type: TokenType.Comment,
    matcher: '//',
  },
  {
    type: TokenType.LeftBracket,
    matcher: '{',
  },
  {
    type: TokenType.RightBracket,
    matcher: '}',
  },
  {
    type: TokenType.LeftParens,
    matcher: '(',
  },
  {
    type: TokenType.RightParens,
    matcher: ')',
  },
  {
    type: TokenType.LeftSquareBracket,
    matcher: '[',
  },
  {
    type: TokenType.RightSquareBracket,
    matcher: ']',
  },
  {
    type: TokenType.Operator,
    matcher: ([] as string[]).concat(FINAL_OPERATORS, LOGICAL_OPERATORS),
  },
  {
    type: TokenType.Pipe,
    matcher: '|',
  },
  {
    type: TokenType.Comma,
    matcher: ',',
  },
  {
    type: TokenType.Range,
    matcher: /(\d+\.\.\d*|\d*\.\.\d+)/g,
    valueExtractor: (value) => {
      const [, left, right] = value.match(/(\d*)\.\.(\d*)/)!
      return [
        parseInt(left),
        parseInt(right),
      ] as const
    },
  },
  {
    type: TokenType.Dot,
    matcher: '.',
  },
  {
    type: TokenType.Number,
    matcher: /[0-9]+(\.[0-9]+)?/,
    construct: Number,
  },
  {
    type: TokenType.Boolean,
    matcher: [
      'true',
      'false',
    ],
    construct: Boolean,
  },
  {
    type: TokenType.Keyword,
    matcher: Array.from(keywordsSet),
    condition: (state, lastToken) => {
      if( state.variableScopeStack.at(-1) || state.variableExpressionStack.at(-1) ) {
        return false
      }

      if( lastToken && lastToken.type === TokenType.Keyword ) {
        switch( lastToken.value ) {
          case 'if':
          case 'badge':
          case 'title': {
            return false
          }
        }
      }

      return true
    },
  },
  {
    type: TokenType.MacroName,
    matcher: /[a-zA-Z]([a-zA-Z0-9]|_)+\(/,
    valueExtractor: (value) => value.slice(0, -1),
  },
  {
    type: TokenType.Identifier,
    matcher: /([a-zA-Z0-9]|_)+/,
  },
  {
    type: TokenType.QuotedString,
    matcher: /"([^"]+)"/,
    valueExtractor: (value) => value.slice(1, -1),
  },
  {
    type: TokenType.AttributeName,
    matcher: /@[a-zA-Z0-9]+/,
    valueExtractor: (value) => value.slice(1),
  },
]

export const tokenize = function (rawInput: string) {
  const input = rawInput.replace(/\r\n/g, '\n')

  let
    index = 0,
    line = 1,
    start = 0,
    end = 0

  const tokens: Token[] = []
  const errors: Diagnostic[] = []

  const state: LexerState = {
    variableScopeStack: [],
    variableExpressionStack: [],
  }

  while( index < input.length ) {
    let hasMatch = false
    for( const { type, matcher, valueExtractor, construct, condition } of TOKENS ) {
      let value: string | undefined
      let token: Token
      const lastToken = tokens.at(-1)

      if( condition ) {
        if( !condition(state, lastToken) ) {
          continue
        }
      }

      if( typeof matcher === 'string' ) {
        if( input.slice(index).startsWith(matcher) ) {
          value = matcher
        }
      } else if( matcher instanceof RegExp ) {
        const currentMatcher = new RegExp(matcher.source, 'y')
        currentMatcher.lastIndex = index

        const matched = currentMatcher.exec(input)
        if( matched ) {
          [value] = matched
        }
      } else {
        const segment = input.slice(index, index + input.slice(index).search(/[ \t\n\{\}\(\)\[\]]/))
        if( segment && matcher.includes(segment) ) {
          value = segment
        }
      }
      if( value ) {
        let tokenValue: Token['value'] | undefined
        const location: Location = {
          index: index += value.length,
          line,
          end: end += value.length,
          start: start = end - value.length,
        }

        switch( type ) {
          case null: break
          case TokenType.LineBreak:
            line++
            end = 0
            start = 0
            break
          case TokenType.Comment: {
            while( input[index++] !== '\n' ) {}
            line++
            break
          }
          default: {
            if( valueExtractor ) {
              tokenValue = construct
                ? construct(valueExtractor(value))
                : valueExtractor(value)
            } else {
              tokenValue = construct
                ? construct(value)
                : value
            }

            token = {
              type,
              location,
              value: tokenValue,
            }

            switch( type ) {
              case TokenType.LeftBracket: {
                let variableScope = false

                if (lastToken && lastToken.type === TokenType.Keyword) {
                  switch( lastToken.value ) {
                    case 'fields':
                    case 'information':
                    case 'form':
                    case 'table':
                    case 'tableMeta':
                    case 'indexes':
                    case 'filters':
                    case 'writable':
                    case 'required':
                    case 'properties': {
                      variableScope = true
                      break
                    }
                  }
                }

                state.variableScopeStack.push(variableScope)
                break
              }
              case TokenType.LeftParens: {
                let variableExpression = false

                if ( lastToken ) {
                  switch( lastToken.type ) {
                    case TokenType.Keyword: {
                      switch( lastToken.value ) {
                        case 'if': {
                          variableExpression = true
                          break
                        }
                      }
                      break
                    }
                    case TokenType.Operator: {
                      variableExpression = true
                      break
                    }
                  }
                }

                state.variableExpressionStack.push(variableExpression)
                break
              }
              case TokenType.RightBracket: {
                if (state.variableScopeStack.length > 0) {
                  state.variableScopeStack.pop()
                }
                break
              }
              case TokenType.RightParens: {
                if (state.variableExpressionStack.length > 0) {
                  state.variableExpressionStack.pop()
                }
                break
              }
            }

            tokens.push(token)
          }
        }

        hasMatch = true
      }
    }

    if( !hasMatch ) {
      index += input.slice(index).search(/[ \t\n\{\}\(\)\[\]]/)
      errors.push(new Diagnostic('unexpected token', {
        index,
        line,
        start,
        end,
      }))
    }
  }
  return {
    tokens,
    errors,
  }
}

