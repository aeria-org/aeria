import type { Location } from './token.js'

const emptyLocation: Location = {
  index: 0,
  line: 0,
  start: 0,
  end: 0,
}

export class Diagnostic extends Error {
  static currentFile: string | undefined

  constructor(public message: string, public location: Location = emptyLocation, public fileLocation = Diagnostic.currentFile) {
    super()
  }
}

