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

export type Location = {
  index:number,
  line:number,
  start:number,
  end:number,
}

export const makeLocation = (token:Token):Location => {
  return{
    index:token.index,
    line:token.line,
    start:token.start,
    end:token.end,
  }
}