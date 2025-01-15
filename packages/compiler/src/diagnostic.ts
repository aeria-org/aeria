import type { Location } from './token.js'

export class Diagnostic extends Error {
  constructor(public message: string, public location?: Location) {
    super()
  }
}

