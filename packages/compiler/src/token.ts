export enum TokenType {
  LineBreak = 'LINE_BREAK',
  Comment = 'COMMENT',
  LeftBracket = 'LEFT_BRACKET',
  RightBracket = 'RIGHT_BRACKET',
  LeftParens = 'LEFT_PARENS',
  RightParens = 'RIGHT_PARENS',
  LeftSquareBracket = 'LEFT_SQUARE_BRACKET',
  RightSquareBracket = 'RIGHT_SQUARE_BRACKET',
  Pipe = 'PIPE',
  Comma = 'COMMA',
  Dot = 'DOT',
  Number = 'NUMBER',
  Boolean = 'BOOLEAN',
  Keyword = 'KEYWORD',
  Identifier = 'IDENTIFIER',
  QuotedString = 'QUOTED_STRING',
  AttributeName = 'ATTRIBUTE_NAME',
}

export type TypeMap = {
  [TokenType.Number]: number
  [TokenType.Boolean]: boolean
}

export type Location = {
  index: number
  line: number
  start: number
  end: number
}

export type Token<
  TTokenType extends TokenType = TokenType,
  TValue = TTokenType extends keyof TypeMap
    ? TypeMap[TTokenType]
    : string,
> = {
  type: TTokenType
  location: Location
  value: TValue
}

