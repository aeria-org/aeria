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
    condition: (state) => !state.inPropertiesStack.at(-1),
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
              case TokenType.RightBracket: {
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

