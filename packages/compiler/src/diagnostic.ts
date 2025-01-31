import type { Location } from './token.js'

export class Diagnostic extends Error {
  static currentFile: string | undefined = undefined

  public fileLocation: string | undefined
  constructor(public message: string, public location?: Location) {
    super()
    this.fileLocation = Diagnostic.currentFile
  }
}

