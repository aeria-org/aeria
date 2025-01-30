import type { Location } from './token.js'

let file: string
export const changeCurrentFile = (newFile: string) => file = newFile
export class Diagnostic extends Error {
  public file: string | undefined = file
  constructor(public message: string, public location?: Location) {
    super()
  }
}

