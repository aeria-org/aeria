import type { Location } from './token.js'

export type Diagnostic = {
  message: string
  location: Location
}
