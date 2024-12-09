import type { Location } from './lexer'

export type Diagnostic = {
  message: string
  location: Location
}
