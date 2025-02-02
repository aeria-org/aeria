type EscapeCode = `[${number}m`

export const AnsiColor = {
  Green: '[32m',
  Yellow: '[33m',
  Blue: '[36m',
  Red: '[31m',
  White: '[37m',
} as const

export const METHOD_COLORS: Record<string, typeof AnsiColor[keyof typeof AnsiColor]> = {
  GET: AnsiColor.Green,
  PUT: AnsiColor.Blue,
  POST: AnsiColor.White,
  DELETE: AnsiColor.Red,
}

export const escape = (code: EscapeCode | EscapeCode[], text: string) => {
  const codeStr = Array.isArray(code)
    ? code.map((c) => `\x1b${c}`).join('')
    : `\x1b${code}`

  return `${codeStr}${text}\x1b[0m`
}

