import { spawn } from 'child_process'

export const $ = async (
  cmd: string | string[],
  options: {
    stdout?: boolean
    stderr?: boolean
  } = {},
) => {
  const result = spawn('sh', [
    '-c',
    Array.isArray(cmd)
      ? cmd.join(';')
      : cmd,
  ])

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

