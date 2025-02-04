import type { TokenType, Token, Location } from './token.js'
import { TokenTypes } from './token.js'
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
  condition?: (state: LexerState) => boolean
}

type LexerState = {
  inPropertiesStack: boolean[]
}

export type Keyword =
  | typeof COLLECTION_KEYWORDS[number]
  | typeof COLLECTION_ACTIONS_KEYWORDS[number]
  | typeof COLLECTION_SEARCH_KEYWORDS[number]
  | typeof CONTRACT_KEYWORDS[number]
  | typeof TOPLEVEL_KEYWORDS[number]
  | typeof MISC_KEYWORDS[number]

export const COLLECTION_KEYWORDS = [
  'actions',
  'filters',
  'form',
  'functions',
  'icon',
  'indexes',
  'individualActions',
  'owned',
  'presets',
  'properties',
  'required',
  'search',
  'table',
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

export const CONTRACT_KEYWORDS = [
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

export const KEYWORDS = ([] as Keyword[]).concat(
  COLLECTION_KEYWORDS,
  COLLECTION_ACTIONS_KEYWORDS,
  COLLECTION_SEARCH_KEYWORDS,
  CONTRACT_KEYWORDS,
  TOPLEVEL_KEYWORDS,
  MISC_KEYWORDS,
)

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
    type: TokenTypes.LineBreak,
    matcher: '\n',
  },
  {
    type: TokenTypes.Comment,
    matcher: '//',
  },
  {
    type: TokenTypes.LeftBracket,
    matcher: '{',
  },
  {
    type: TokenTypes.RightBracket,
    matcher: '}',
  },
  {
    type: TokenTypes.LeftParens,
    matcher: '(',
  },
  {
    type: TokenTypes.RightParens,
    matcher: ')',
  },
  {
    type: TokenTypes.LeftSquareBracket,
    matcher: '[',
  },
  {
    type: TokenTypes.RightSquareBracket,
    matcher: ']',
  },
  {
    type: TokenTypes.Pipe,
    matcher: '|',
  },
  {
    type: TokenTypes.Comma,
    matcher: ',',
  },
  {
    type: TokenTypes.Range,
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
    type: TokenTypes.Dot,
    matcher: '.',
  },
  {
    type: TokenTypes.Number,
    matcher: /[0-9]+(\.[0-9]+)?/,
    construct: Number,
  },
  {
    type: TokenTypes.Boolean,
    matcher: [
      'true',
      'false',
    ],
    construct: Boolean,
  },
  {
    type: TokenTypes.Keyword,
    matcher: Array.from(keywordsSet),
    condition: (state) => !state.inPropertiesStack.at(-1),
  },
  {
    type: TokenTypes.MacroName,
    matcher: /[a-zA-Z]([a-zA-Z0-9]|_)+\(/,
    valueExtractor: (value) => value.slice(0, -1),
  },
  {
    type: TokenTypes.Identifier,
    matcher: /([a-zA-Z0-9]|_)+/,
  },
  {
    type: TokenTypes.QuotedString,
    matcher: /"([^"]+)"/,
    valueExtractor: (value) => value.slice(1, -1),
  },
  {
    type: TokenTypes.AttributeName,
    matcher: /@[a-zA-Z0-9]+/,
    valueExtractor: (value) => value.slice(1),
  },
]

export const tokenize = function (input: string) {
  let
    index = 0,
    line = 1,
    start = 0,
    end = 0

  const tokens: Token[] = []
  const errors: Diagnostic[] = []

  const state: LexerState = {
    inPropertiesStack: [],
  }

  while( index < input.length ) {
    let hasMatch = false
    for( const { type, matcher, valueExtractor, construct, condition } of TOKENS ) {
      let value: string | undefined
      let token: Token

      if( condition ) {
        if( !condition(state) ) {
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
          case TokenTypes.LineBreak:
            line++
            end = 0
            start = 0
            break
          case TokenTypes.Comment: {
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
              case TokenTypes.LeftBracket: {
                const lastToken = tokens.at(-1)
                if (lastToken) {
                  if (lastToken.value === 'properties') {
                    state.inPropertiesStack.push(true)
                  } else {
                    state.inPropertiesStack.push(false)
                  }
                }
                break
              }
              case TokenTypes.RightBracket: {
                if (state.inPropertiesStack.length > 0) {
                  state.inPropertiesStack.pop()
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

