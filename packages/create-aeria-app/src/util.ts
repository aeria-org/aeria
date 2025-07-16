import { spawn } from 'node:child_process'

export type ResultTuple =
  | [string | string[]]
  | [undefined, string | string[]]

export const error = (value: string | string[]): ResultTuple => [value]
export const success = (value: string | string[]): ResultTuple => [, value]
export const isError = (tuple: ResultTuple) => !!tuple[0]
export const unwrap = (tuple: ResultTuple) => tuple[0] || tuple[1]

export const $ = async (
  cmd: readonly string[],
  options: {
    cwd?: string
    stdout?: boolean
    stderr?: boolean
  } = {},
) => {
  const result = spawn(cmd[0], cmd.slice(1), {
    cwd: options.cwd,
    shell: true,
  })

  if( options.stdout ) {
    result.stdout.pipe(process.stdout)
  }

  if (options.stderr !== false) {
    result.stderr.pipe(process.stderr)
  }

  const stdout: string[] = []
  for await( const chunk of result.stdout ) {
    stdout.push(chunk.toString())
  }

  return stdout.join('\n').trim()
}

export const LogLevel = {
  Info: 'info',
  Error: 'error',
  Warning: 'warning',
  Debug: 'debug',
} as const

export const log = (level: typeof LogLevel[keyof typeof LogLevel], value: unknown) => {
  console.log(
    `[${level}]`,
    Array.isArray(value)
      ? value.join('\n')
      : value,
  )
}

