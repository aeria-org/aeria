import type { Location } from './token.js'

const emptyLocation: Location = {
  file: '',
  index: 0,
  line: 0,
  start: 0,
  end: 0,
}

export class Diagnostic extends Error {
  constructor(public message: string, public location = emptyLocation) {
    super()

    if( process.env.NODE_ENV === 'debug' ) {
      console.error(message, location)
    }
  }
}

