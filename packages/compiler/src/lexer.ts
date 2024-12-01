export enum TokenType {
  LeftBracket = 'LEFT_BRACKET',
  RightBracket = 'RIGHT_BRACKET',
  LeftParens = 'LEFT_PARENS',
  RightParens = 'RIGHT_PARENS',
  Pipe = 'PIPE',
  Number = 'Number',
  Identifier = 'IDENTIFIER',
  AttributeName = 'ATTRIBUTE_NAME',
}

export type TokenConfig = {
  type:
    | TokenType
    | null
  matcher: RegExp
  valueExtractor?: (value: string) => string
}

export type Token = {
  type: TokenType
  index: number
  value: string
}

const TOKENS: TokenConfig[] = [
  {
    type: null,
    matcher: /\r?[ \t\n]+/,
  },
  {
    type: TokenType.LeftBracket,
    matcher: /{/,
  },
  {
    type: TokenType.RightBracket,
    matcher: /}/,
  },
  {
    type: TokenType.LeftParens,
    matcher: /\(/,
  },
  {
    type: TokenType.RightParens,
    matcher: /\)/,
  },
  {
    type: TokenType.Pipe,
    matcher: /\|/,
  },
  {
    type: TokenType.Number,
    matcher: /[0-9]+(\.[0-9]+)?/,
  },
  {
    type: TokenType.Identifier,
    matcher: /[a-zA-Z0-9]+/,
  },
  {
    type: TokenType.AttributeName,
    matcher: /@[a-zA-Z0-9]+/,
    valueExtractor: (value) => value.slice(1),
  },
]

export const tokenize = function *(input: string): Generator<Token> {
  let index = 0

  while( index < input.length ) {
    let hasMatch = false

    for( const { type, matcher, valueExtractor } of TOKENS ) {
      const currentMatcher = new RegExp(matcher.source, 'y')
      currentMatcher.lastIndex = index

      const matched = currentMatcher.exec(input)
      if( matched !== null ) {
        const [value] = matched
        index += value.length
        if( type !== null ) {
          if( valueExtractor ) {
            yield {
              type,
              index,
              value: valueExtractor(value),
            }
            continue
          }

          yield {
            type,
            index,
            value,
          }
        }

        hasMatch = true
      }
    }

    if( !hasMatch ) {
      throw new Error(`unexpected token at index "${index}"`)
    }
  }
}

