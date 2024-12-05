export type Diagnostic = {
  message: string
  location:{
    line: number
    index: number
    start: number
    end: number
  }
}
