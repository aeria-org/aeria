import { type Token } from './lexer'

export type Diagnostic = {
  message: string
  location:{
    line: number
    index: number
    start: number
    end: number
  }
}

export function makeLocation(token: Token){
  return{
    index:token.index,
    line:token.line,
    start:token.start,
    end:token.end,
  }
}