import type { Token, Location } from './lexer'

export type Diagnostic = {
  message: string
  location: Location
}

export const makeLocation = (token:Token):Location => {
  return{
    index:token.location.index,
    line:token.location.line,
    start:token.location.start,
    end:token.location.end,
  }
}